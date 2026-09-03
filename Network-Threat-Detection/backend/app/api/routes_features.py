"""Feature extraction API routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.features import extract_feature_bundle
from backend.app.schemas import DatasetKind
from backend.data_adapters import get_adapter


router = APIRouter(prefix="/api/features", tags=["features"])


class FeatureExtractionRequest(BaseModel):
    path: str = Field(description="Local CSV or PCAP path supplied by the user/demo environment.")
    dataset: DatasetKind = DatasetKind.GENERIC_CSV
    window_seconds: int = Field(default=10, ge=1)
    max_records: int = Field(default=5000, ge=1, le=100000)
    internal_prefixes: list[str] = Field(default_factory=list)


@router.post("/extract")
def extract_features(request: FeatureExtractionRequest) -> dict[str, object]:
    adapter = get_adapter(request.dataset)
    try:
        result = adapter.load(request.path)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=400, detail=f"Input file not found: {request.path}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    records = result.records.head(request.max_records)
    bundle = extract_feature_bundle(
        records,
        window_seconds=request.window_seconds,
        internal_prefixes=tuple(request.internal_prefixes),
    )
    return {
        "dataset": result.dataset,
        "source_kind": result.source_kind,
        "record_count": int(len(records)),
        "warnings": result.warnings,
        "features": bundle.as_dict(),
    }
