"""Network behaviour graph API routes."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.graph import build_network_behavior_graph
from backend.app.schemas import DatasetKind
from backend.data_adapters import get_adapter
from backend.app.state import build_canonical_states
from graph_builder import build_graph_state
from data_pipeline.states import iter_windowed_states


PROJECT_ROOT = Path(__file__).resolve().parents[3]
router = APIRouter(prefix="/api/graph", tags=["network-behaviour-graph"])


class NetworkGraphRequest(BaseModel):
    path: str
    dataset: DatasetKind = DatasetKind.GENERIC_CSV
    scenario: str = "sih-network-graph-demo"
    capture_id: str = "local"
    window_seconds: int = Field(default=10, ge=1)
    max_records: int = Field(default=5000, ge=1, le=250000)
    graph_limit: int = Field(default=5, ge=1, le=25)


@router.post("/network")
def network_graph(request: NetworkGraphRequest) -> dict[str, object]:
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
    graph_sequence: list[dict[str, object]] = []
    for state, window_records in iter_windowed_states(
        records,
        window_seconds=request.window_seconds,
        dataset=result.dataset,
        scenario=request.scenario,
        capture_id=request.capture_id,
        split="demo",
    ):
        graph_sequence.append(build_graph_state(state, window_records))

    graph_sequence = graph_sequence[-request.graph_limit :]
    graph = build_network_behavior_graph(states, graph_sequence)
    graph.update(
        {
            "dataset": result.dataset,
            "source_kind": result.source_kind,
            "warnings": result.warnings,
        }
    )
    return graph
