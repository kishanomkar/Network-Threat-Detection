"""Threat investigation API routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.api.routes_forecast import lstm_service
from backend.app.detection import detect_current_threat
from backend.app.forecasting import forecast_with_temporal_fallback
from backend.app.graph import build_network_behavior_graph
from backend.app.investigation import build_investigation_case
from backend.app.schemas import DatasetKind
from backend.app.state import build_canonical_states
from backend.app.timeline import build_attack_progression_timeline
from backend.data_adapters import get_adapter
from data_pipeline.states import iter_windowed_states
from graph_builder import build_graph_state


router = APIRouter(prefix="/api/investigate", tags=["threat-investigation"])


class InvestigationRequest(BaseModel):
    path: str
    dataset: DatasetKind = DatasetKind.GENERIC_CSV
    scenario: str = "sih-investigation-demo"
    capture_id: str = "local"
    window_seconds: int = Field(default=10, ge=1)
    sequence_length: int = Field(default=5, ge=1)
    horizon: int = Field(default=5, ge=1, le=24)
    max_records: int = Field(default=1000, ge=1, le=250000)
    fast_mode: bool = True


@router.post("/case")
def investigation_case(request: InvestigationRequest) -> dict[str, object]:
    adapter = get_adapter(request.dataset)
    try:
        result = adapter.load(request.path)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=400, detail=f"Input file not found: {request.path}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    records = result.records.head(request.max_records)
    states = build_canonical_states(
        records,
        window_seconds=request.window_seconds,
        dataset=result.dataset,
        scenario=request.scenario,
        capture_id=request.capture_id,
        split="demo",
    )
    if not states:
        return {"status": "NO_DATA", "message": "No network states could be generated", "warnings": result.warnings}

    sequence_states = states[-request.sequence_length :]
    if request.fast_mode:
        forecast_result = forecast_with_temporal_fallback(sequence_states, horizon=request.horizon)
    elif lstm_service.is_available:
        try:
            forecast_result = lstm_service.forecast(sequence_states, horizon=request.horizon)
        except RuntimeError:
            forecast_result = forecast_with_temporal_fallback(sequence_states, horizon=request.horizon)
    else:
        forecast_result = forecast_with_temporal_fallback(sequence_states, horizon=request.horizon)

    graph_sequence = [
        build_graph_state(state, window_records)
        for state, window_records in iter_windowed_states(
            records,
            window_seconds=request.window_seconds,
            dataset=result.dataset,
            scenario=request.scenario,
            capture_id=request.capture_id,
            split="demo",
        )
    ][-5:]

    detection = detect_current_threat(states)
    detection.update({"dataset": result.dataset, "source_kind": result.source_kind, "state_count": len(states)})
    forecast = {
        "future_risk": int(round(forecast_result.predicted_risk * 100)),
        "predicted_stage": forecast_result.predicted_stage.value,
        "evidence": forecast_result.evidence,
    }
    graph = build_network_behavior_graph(states, graph_sequence)
    timeline = build_attack_progression_timeline(
        states[-10:],
        [step.model_dump(mode="json") for step in forecast_result.forecast],
    )

    case = build_investigation_case(detection=detection, forecast=forecast, graph=graph, timeline=timeline)
    case.update({"dataset": result.dataset, "source_kind": result.source_kind, "warnings": result.warnings})
    return case
