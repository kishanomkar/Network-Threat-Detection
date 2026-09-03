"""Forecasting API routes."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.forecasting import AntcmForecastService
from backend.app.forecasting import LstmForecastService, forecast_with_temporal_fallback
from backend.app.risk import calculate_risk_level
from backend.app.schemas import DatasetKind, ModelOutput, NetworkState
from backend.app.state import build_canonical_states
from backend.data_adapters import get_adapter


PROJECT_ROOT = Path(__file__).resolve().parents[3]
router = APIRouter(prefix="/api/forecast", tags=["forecast"])
service = AntcmForecastService(PROJECT_ROOT)
lstm_service = LstmForecastService(PROJECT_ROOT / "models" / "lstm_world_model.pt")


class ForecastRequest(BaseModel):
    states: list[NetworkState]
    horizon: int = Field(default=5, ge=1, le=24)
    model: str = "antcm"


class FileForecastRequest(BaseModel):
    path: str
    dataset: DatasetKind = DatasetKind.GENERIC_CSV
    scenario: str = "sih-future-forecast-demo"
    capture_id: str = "local"
    window_seconds: int = Field(default=10, ge=1)
    sequence_length: int = Field(default=5, ge=1)
    horizon: int = Field(default=5, ge=1, le=24)
    max_records: int = Field(default=5000, ge=1, le=250000)


@router.post("", response_model=ModelOutput)
def forecast(request: ForecastRequest) -> ModelOutput:
    if request.model != "antcm":
        raise HTTPException(status_code=404, detail=f"Model '{request.model}' is not registered for Phase 2 inference")
    try:
        return service.forecast(request.states, horizon=request.horizon)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/file")
def forecast_file(request: FileForecastRequest) -> dict[str, object]:
    adapter = get_adapter(request.dataset)
    try:
        result = adapter.load(request.path)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=400, detail=f"Input file not found: {request.path}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    states = build_canonical_states(
        result.records.head(request.max_records),
        window_seconds=request.window_seconds,
        dataset=result.dataset,
        scenario=request.scenario,
        capture_id=request.capture_id,
        split="demo",
    )
    if not states:
        return {
            "status": "NO_DATA",
            "message": "No network states could be generated from the supplied traffic",
            "warnings": result.warnings,
        }

    sequence_states = states[-request.sequence_length :]
    if lstm_service.is_available:
        try:
            forecast_result = lstm_service.forecast(sequence_states, horizon=request.horizon)
        except RuntimeError:
            forecast_result = forecast_with_temporal_fallback(sequence_states, horizon=request.horizon)
    else:
        forecast_result = forecast_with_temporal_fallback(sequence_states, horizon=request.horizon)

    current_risk = int(round(forecast_result.current_risk * 100))
    future_risk = int(round(forecast_result.predicted_risk * 100))
    return {
        "status": "success",
        "dataset": result.dataset,
        "source_kind": result.source_kind,
        "state_count": len(states),
        "sequence_length": len(sequence_states),
        "horizon": request.horizon,
        "current_risk": current_risk,
        "current_risk_level": calculate_risk_level(current_risk).value,
        "future_risk": future_risk,
        "future_risk_level": calculate_risk_level(future_risk).value,
        "predicted_stage": forecast_result.predicted_stage.value,
        "confidence": int(round(forecast_result.confidence * 100)),
        "timeline": [step.model_dump(mode="json") for step in forecast_result.forecast],
        "evidence": forecast_result.evidence,
        "top_features": forecast_result.top_features,
        "model": forecast_result.model,
        "model_version": forecast_result.model_version,
        "warnings": result.warnings,
    }
