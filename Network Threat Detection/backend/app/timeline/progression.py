"""Build observed and forecast attack progression timeline events."""

from __future__ import annotations

from backend.app.risk import calculate_risk_level, calculate_state_risk
from backend.app.schemas import NetworkState
from backend.training.create_sequences import infer_attack_stage


def build_attack_progression_timeline(
    states: list[NetworkState],
    forecast_steps: list[dict[str, object]] | None = None,
) -> dict[str, object]:
    observed = [_observed_event(state, index + 1) for index, state in enumerate(states)]
    predicted = [_predicted_event(step) for step in forecast_steps or []]
    combined = observed + predicted
    return {
        "status": "success" if combined else "NO_DATA",
        "observed_count": len(observed),
        "predicted_count": len(predicted),
        "timeline": combined,
        "stage_path": _compress_stage_path(combined),
    }


def _observed_event(state: NetworkState, step: int) -> dict[str, object]:
    stage = infer_attack_stage(state)
    risk = int(round(calculate_state_risk(state, stage) * 100))
    return {
        "id": state.state_id,
        "kind": "observed",
        "step": step,
        "timestamp": state.timestamp.isoformat(),
        "stage": stage.value,
        "risk": risk,
        "risk_level": calculate_risk_level(risk).value,
        "summary": _summary_for_state(state),
        "signals": {
            "scan": round(state.scan_score, 4),
            "beacon": round(state.beacon_score, 4),
            "exfiltration": round(state.exfiltration_score, 4),
        },
    }


def _predicted_event(step: dict[str, object]) -> dict[str, object]:
    risk = int(round(float(step["risk"]) * 100))
    return {
        "id": f"forecast:{step['step']}",
        "kind": "predicted",
        "step": int(step["step"]),
        "timestamp": None,
        "stage": str(step["stage"]),
        "risk": risk,
        "risk_level": calculate_risk_level(risk).value,
        "confidence": int(round(float(step["confidence"]) * 100)),
        "summary": f"Forecast step {step['step']} predicts {step['stage']} at {risk}% risk.",
        "signals": {},
    }


def _summary_for_state(state: NetworkState) -> str:
    return (
        f"{state.flow_count} flows, {int(state.packet_count)} packets, "
        f"{state.unique_destinations} destinations, {state.unique_ports} ports."
    )


def _compress_stage_path(events: list[dict[str, object]]) -> list[str]:
    path: list[str] = []
    for event in events:
        stage = str(event["stage"])
        if not path or path[-1] != stage:
            path.append(stage)
    return path
