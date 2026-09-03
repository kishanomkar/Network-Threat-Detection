"""Deterministic temporal fallback used until the LSTM is trained."""

from __future__ import annotations

from datetime import datetime, timezone

from backend.app.explainability import generate_evidence
from backend.app.risk import calculate_state_risk
from backend.app.schemas import AttackStage, ForecastStep, ModelOutput, NetworkState
from backend.training.create_sequences import infer_attack_stage


def forecast_with_temporal_fallback(states: list[NetworkState], *, horizon: int = 5) -> ModelOutput:
    if not states:
        raise ValueError("At least one NetworkState is required")
    latest = states[-1]
    current_stage = infer_attack_stage(latest)
    current_risk = calculate_state_risk(latest, current_stage)
    trend = _risk_trend(states)
    forecast_steps: list[ForecastStep] = []
    risk = current_risk
    stage = current_stage
    for step in range(1, horizon + 1):
        risk = min(1.0, risk + trend + 0.03)
        stage = _advance_stage(stage, risk)
        forecast_steps.append(
            ForecastStep(
                step=step,
                risk=round(risk, 4),
                stage=stage,
                confidence=round(max(0.55, min(0.85, 0.60 + abs(trend))), 4),
            )
        )
    evidence, top_features = generate_evidence(states)
    return ModelOutput(
        timestamp=datetime.now(timezone.utc),
        current_risk=current_risk,
        predicted_risk=forecast_steps[-1].risk,
        predicted_stage=forecast_steps[-1].stage,
        confidence=forecast_steps[-1].confidence,
        forecast=forecast_steps,
        evidence=evidence,
        top_features=top_features,
        model="temporal-fallback",
        model_version="mvp-0.1",
    )


def _risk_trend(states: list[NetworkState]) -> float:
    if len(states) < 2:
        return 0.0
    scored = [calculate_state_risk(state, infer_attack_stage(state)) for state in states[-5:]]
    return max(-0.05, min(0.12, (scored[-1] - scored[0]) / max(len(scored) - 1, 1)))


def _advance_stage(stage: AttackStage, risk: float) -> AttackStage:
    order = [
        AttackStage.BENIGN,
        AttackStage.RECONNAISSANCE,
        AttackStage.INITIAL_ACCESS,
        AttackStage.LATERAL_MOVEMENT,
        AttackStage.COMMAND_AND_CONTROL,
        AttackStage.EXFILTRATION,
    ]
    index = order.index(stage) if stage in order else 1
    if risk >= 0.80:
        index = max(index, 4)
    elif risk >= 0.60:
        index = max(index, 3)
    elif risk >= 0.35:
        index = max(index, 1)
    return order[min(index, len(order) - 1)]

