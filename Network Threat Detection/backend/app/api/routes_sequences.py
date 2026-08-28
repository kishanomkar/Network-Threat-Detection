"""Sequence creation API routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.schemas import DatasetKind
from backend.app.state import build_canonical_states
from backend.data_adapters import get_adapter
from backend.training.create_sequences import create_sequence_examples, save_sequence_examples


router = APIRouter(prefix="/api/sequences", tags=["sequences"])


class SequenceCreationRequest(BaseModel):
    path: str
    dataset: DatasetKind = DatasetKind.GENERIC_CSV
    scenario: str = "uploaded"
    capture_id: str = "local"
    window_seconds: int = Field(default=10, ge=1)
    sequence_length: int = Field(default=10, ge=1)
    forecast_offset: int = Field(default=1, ge=1)
    max_records: int = Field(default=10000, ge=1, le=250000)
    output_path: str | None = Field(default=None, description="Optional JSONL path for saved sequence examples.")


@router.post("/create")
def create_sequences(request: SequenceCreationRequest) -> dict[str, object]:
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
    examples = create_sequence_examples(
        states,
        sequence_length=request.sequence_length,
        forecast_offset=request.forecast_offset,
    )
    saved_path = save_sequence_examples(examples, request.output_path) if request.output_path else None
    return {
        "dataset": result.dataset,
        "source_kind": result.source_kind,
        "state_count": len(states),
        "sequence_count": len(examples),
        "sequence_length": request.sequence_length,
        "forecast_offset": request.forecast_offset,
        "warnings": result.warnings,
        "saved_path": str(saved_path) if saved_path else None,
        "examples": [example.model_dump(mode="json") for example in examples[:10]],
    }
