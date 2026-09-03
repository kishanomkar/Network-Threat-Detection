"""Current threat detection API routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.detection import detect_current_threat
from backend.app.schemas import DatasetKind
from backend.app.state import build_canonical_states
from backend.data_adapters import get_adapter


router = APIRouter(prefix="/api/threats", tags=["current-threat-detection"])


class CurrentThreatRequest(BaseModel):
    path: str
    dataset: DatasetKind = DatasetKind.GENERIC_CSV
    scenario: str = "sih-current-threat-demo"
    capture_id: str = "local"
    window_seconds: int = Field(default=10, ge=1)
    max_records: int = Field(default=5000, ge=1, le=250000)


@router.post("/current")
def current_threat(request: CurrentThreatRequest) -> dict[str, object]:
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
    detection = detect_current_threat(states)
    detection.update(
        {
            "dataset": result.dataset,
            "source_kind": result.source_kind,
            "state_count": len(states),
            "warnings": result.warnings,
        }
    )
    return detection
