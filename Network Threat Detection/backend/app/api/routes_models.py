"""Model registry API routes."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter

from backend.app.forecasting import AntcmForecastService


PROJECT_ROOT = Path(__file__).resolve().parents[3]
router = APIRouter(prefix="/api/models", tags=["models"])
service = AntcmForecastService(PROJECT_ROOT)


@router.get("")
def list_models() -> dict[str, object]:
    return {"models": service.registry.list_models()}


@router.get("/antcm/status")
def antcm_status() -> dict[str, object]:
    return service.status

