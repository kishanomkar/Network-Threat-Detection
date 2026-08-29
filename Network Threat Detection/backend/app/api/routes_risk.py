"""Explainable composite risk scoring API."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.explainability.attributions import explain_current_threat
from backend.app.forecasting import LstmForecastService, forecast_with_temporal_fallback
from backend.app.risk.risk_engine import score_composite_risk
from backend.app.schemas import DatasetKind
from backend.app.state import build_canonical_states
from backend.data_adapters import get_adapter

router = APIRouter(prefix="/api/risk", tags=["risk-engine"])
PROJECT_ROOT = Path(__file__).resolve().parents[3]
lstm_service = LstmForecastService(PROJECT_ROOT / "models" / "lstm_world_model.pt")


class RiskScoreRequest(BaseModel):
    path: str
    dataset: DatasetKind = DatasetKind.GENERIC_CSV
    scenario: str = "sih-risk-demo"
    capture_id: str = "local"
    window_seconds: int = Field(default=10, ge=1)
    max_records: int = Field(default=5000, ge=1, le=250000)

class RiskAssessmentRequest(BaseModel):
    path: str
    dataset: DatasetKind = DatasetKind.GENERIC_CSV
    scenario: str = "sih-risk-demo"
    capture_id: str = "local"
    window_seconds: int = Field(default=10, ge=1)
    max_records: int = Field(default=5000, ge=1, le=250000)
    sequence_length: int = Field(default=5, ge=1)
    horizon: int = Field(default=5, ge=1, le=24)


@router.post("/score")
def score_risk(request: RiskScoreRequest) -> dict[str, object]:
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
    scored = score_composite_risk(states)
    scored.update(
        {
            "dataset": result.dataset,
            "source_kind": result.source_kind,
            "state_count": len(states),
            "warnings": result.warnings,
        }
    )
    return scored


@router.post("/assessment")
def get_risk_assessment(request: RiskAssessmentRequest) -> dict[str, object]:
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

    # Current risk from score_composite_risk
    scored = score_composite_risk(states)
    overall_risk_score = scored.get("score", 0)
    risk_level = scored.get("level", "LOW")
    components_raw = scored.get("components", [])
    components = {comp["name"]: comp["points"] for comp in components_raw}
    
    # Explainability
    explain = explain_current_threat(states)
    top_risk_drivers = explain.get("contributions", [])
    
    # Future Risk
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
    
    # Trend
    risk_trend = []
    # use last few states for trend
    from backend.app.risk.risk_engine import calculate_state_risk
    from backend.training.create_sequences import infer_attack_stage
    
    trend_states = states[-10:] if len(states) >= 10 else states
    for idx, s in enumerate(trend_states):
        stage = infer_attack_stage(s)
        state_r = int(calculate_state_risk(s, stage) * 100)
        risk_trend.append({"timestamp": f"T-{len(trend_states) - idx}", "risk": state_r})

    explanation_text = f"Risk is currently {risk_level} at {overall_risk_score}/100. "
    if future_risk > overall_risk_score:
        explanation_text += f"Forecast models predict risk will increase to {future_risk}/100 in the next {request.horizon} time windows. "
    elif future_risk < overall_risk_score:
        explanation_text += f"Forecast models predict risk will decrease to {future_risk}/100 in the next {request.horizon} time windows. "
    else:
        explanation_text += f"Forecast models predict risk will remain steady around {future_risk}/100. "
        
    if top_risk_drivers:
        top_driver = top_risk_drivers[0]
        explanation_text += f"The primary driver is '{top_driver.get('feature')}'."

    return {
        "status": "success",
        "overall_risk_score": overall_risk_score,
        "risk_level": risk_level,
        "current_risk": current_risk,
        "future_risk": future_risk,
        "components": components,
        "risk_trend": risk_trend,
        "top_risk_drivers": top_risk_drivers,
        "explanation": explanation_text,
        "dataset": result.dataset,
        "warnings": result.warnings,
    }


class RiskTimelineRequest(BaseModel):
    path: str
    dataset: DatasetKind = DatasetKind.GENERIC_CSV
    scenario: str = "sih-risk-demo"
    capture_id: str = "local"
    window_seconds: int = Field(default=10, ge=1)
    max_records: int = Field(default=5000, ge=1, le=250000)
    sequence_length: int = Field(default=5, ge=1)
    horizon: int = Field(default=5, ge=1, le=24)
    observed_limit: int = Field(default=12, ge=1, le=50)


@router.post("/timeline")
def risk_timeline(request: RiskTimelineRequest) -> dict[str, object]:
    """Return per-window observed risk + forecast risk for the RiskChart."""
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
        return {"status": "NO_DATA", "chart": [], "warnings": result.warnings}

    from backend.app.risk.risk_engine import calculate_state_risk
    from backend.training.create_sequences import infer_attack_stage

    # ---- Observed risk per window ----
    observed_states = states[-request.observed_limit:]
    chart: list[dict[str, object]] = []
    for idx, s in enumerate(observed_states):
        stage = infer_attack_stage(s)
        risk_val = int(round(calculate_state_risk(s, stage) * 100))
        chart.append({
            "time": f"W{idx + 1}",
            "observed": risk_val,
        })

    # ---- Forecast risk ----
    sequence_states = states[-request.sequence_length:]
    if lstm_service.is_available:
        try:
            forecast_result = lstm_service.forecast(sequence_states, horizon=request.horizon)
        except RuntimeError:
            forecast_result = forecast_with_temporal_fallback(sequence_states, horizon=request.horizon)
    else:
        forecast_result = forecast_with_temporal_fallback(sequence_states, horizon=request.horizon)

    # Bridge: last observed point is also the first forecast point
    if chart:
        chart[-1]["forecast"] = chart[-1]["observed"]

    for step in forecast_result.forecast:
        risk_val = int(round(step.risk * 100))
        chart.append({
            "time": f"F+{step.step}",
            "forecast": risk_val,
        })

    # ---- Top risk drivers from last state ----
    latest = states[-1]
    drivers = [
        {"name": "Scan Activity", "pct": int(round(latest.scan_score * 100))},
        {"name": "Beacon Score", "pct": int(round(latest.beacon_score * 100))},
        {"name": "Exfiltration", "pct": int(round(latest.exfiltration_score * 100))},
        {"name": "Host Fan-out", "pct": min(100, int(round(latest.host_fanout)))},
        {"name": "Port Fan-out", "pct": min(100, int(round(latest.port_fanout)))},
    ]
    drivers.sort(key=lambda d: d["pct"], reverse=True)

    # ---- Current threat summary ----
    current_stage = infer_attack_stage(latest)
    current_risk_val = int(round(calculate_state_risk(latest, current_stage) * 100))
    future_risk_val = int(round(forecast_result.predicted_risk * 100))

    return {
        "status": "success",
        "chart": chart,
        "drivers": drivers,
        "current_risk": current_risk_val,
        "future_risk": future_risk_val,
        "current_stage": current_stage.value,
        "predicted_stage": forecast_result.predicted_stage.value,
        "confidence": int(round(forecast_result.confidence * 100)),
        "active_hosts": latest.host_fanout,
        "suspicious_ports": latest.port_fanout,
        "dataset": result.dataset,
        "warnings": result.warnings,
    }
