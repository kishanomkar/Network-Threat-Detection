"""High-level SIH MVP analysis endpoint."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from pathlib import Path

from backend.app.forecasting import LstmForecastService, forecast_with_temporal_fallback
from backend.app.risk import calculate_risk_level
from backend.app.schemas import DatasetKind
from backend.app.state import build_canonical_states
from backend.data_adapters import get_adapter
from backend.training.create_sequences import create_sequence_examples, infer_attack_stage


router = APIRouter(prefix="/api", tags=["analyze"])
PROJECT_ROOT = Path(__file__).resolve().parents[3]
lstm_service = LstmForecastService(PROJECT_ROOT / "models" / "lstm_world_model.pt")


class AnalyzeRequest(BaseModel):
    path: str
    dataset: DatasetKind = DatasetKind.GENERIC_CSV
    scenario: str = "sih-internal-demo"
    capture_id: str = "local"
    window_seconds: int = Field(default=10, ge=1)
    sequence_length: int = Field(default=5, ge=1)
    horizon: int = Field(default=5, ge=1, le=12)
    max_records: int = Field(default=10000, ge=1, le=250000)


@router.post("/analyze")
def analyze(request: AnalyzeRequest) -> dict[str, object]:
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
            forecast = lstm_service.forecast(sequence_states, horizon=request.horizon)
        except RuntimeError:
            forecast = forecast_with_temporal_fallback(sequence_states, horizon=request.horizon)
    else:
        forecast = forecast_with_temporal_fallback(sequence_states, horizon=request.horizon)
    current_stage = infer_attack_stage(states[-1])
    current_risk_score = int(round(forecast.current_risk * 100))
    future_risk_score = int(round(forecast.predicted_risk * 100))
    examples = create_sequence_examples(states, sequence_length=min(request.sequence_length, len(states)))
    return {
        "status": "success",
        "mode": "MVP_TEMPORAL_FALLBACK_UNTIL_LSTM_TRAINED",
        "dataset": result.dataset,
        "source_kind": result.source_kind,
        "state_count": len(states),
        "sequence_count": len(examples),
        "current_status": _status_from_score(current_risk_score, current_stage),
        "current_attack": current_stage.value,
        "current_risk": current_risk_score,
        "current_risk_level": calculate_risk_level(current_risk_score).value,
        "future_risk": future_risk_score,
        "future_risk_level": calculate_risk_level(future_risk_score).value,
        "predicted_stage": forecast.predicted_stage.value,
        "confidence": int(round(forecast.confidence * 100)),
        "timeline": [step.model_dump(mode="json") for step in forecast.forecast],
        "explanations": forecast.evidence,
        "top_features": forecast.top_features,
        "warnings": result.warnings,
        "model": forecast.model,
    }


def _status_from_score(score: int, stage: object) -> str:
    if score >= 61:
        return "ATTACK"
    if score >= 31 or str(getattr(stage, "value", stage)).lower() not in {"benign", "normal"}:
        return "SUSPICIOUS"
    return "NORMAL"
