"""Attack progression timeline API routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.forecasting import LstmForecastService, forecast_with_temporal_fallback
from backend.app.schemas import DatasetKind
from backend.app.state import build_canonical_states
from backend.app.timeline import build_attack_progression_timeline
from backend.data_adapters import get_adapter

from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[3]
router = APIRouter(prefix="/api/timeline", tags=["attack-progression-timeline"])
lstm_service = LstmForecastService(PROJECT_ROOT / "models" / "lstm_world_model.pt")


class TimelineRequest(BaseModel):
    path: str
    dataset: DatasetKind = DatasetKind.GENERIC_CSV
    scenario: str = "sih-timeline-demo"
    capture_id: str = "local"
    window_seconds: int = Field(default=10, ge=1)
    sequence_length: int = Field(default=5, ge=1)
    horizon: int = Field(default=5, ge=1, le=24)
    max_records: int = Field(default=5000, ge=1, le=250000)
    observed_limit: int = Field(default=12, ge=1, le=100)


@router.post("/progression")
def progression_timeline(request: TimelineRequest) -> dict[str, object]:
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
        return {"status": "NO_DATA", "message": "No network states could be generated", "warnings": result.warnings}

    sequence_states = states[-request.sequence_length :]
    if lstm_service.is_available:
        try:
            forecast = lstm_service.forecast(sequence_states, horizon=request.horizon)
        except RuntimeError:
            forecast = forecast_with_temporal_fallback(sequence_states, horizon=request.horizon)
    else:
        forecast = forecast_with_temporal_fallback(sequence_states, horizon=request.horizon)

    observed_states = states[-request.observed_limit :]
    timeline = build_attack_progression_timeline(
        observed_states,
        [step.model_dump(mode="json") for step in forecast.forecast],
    )
    timeline.update(
        {
            "dataset": result.dataset,
            "source_kind": result.source_kind,
            "state_count": len(states),
            "model": forecast.model,
            "warnings": result.warnings,
        }
    )
    return timeline
