"""Transparent risk scoring for the SIH MVP."""

from __future__ import annotations

from backend.app.schemas import AttackStage, NetworkState, RiskLevel


STAGE_SEVERITY = {
    AttackStage.BENIGN: 0.05,
    AttackStage.RECONNAISSANCE: 0.35,
    AttackStage.INITIAL_ACCESS: 0.55,
    AttackStage.EXECUTION: 0.65,
    AttackStage.PERSISTENCE: 0.65,
    AttackStage.PRIVILEGE_ESCALATION: 0.75,
    AttackStage.LATERAL_MOVEMENT: 0.80,
    AttackStage.COMMAND_AND_CONTROL: 0.85,
    AttackStage.EXFILTRATION: 0.90,
}

COMPONENT_WEIGHTS = {
    "current_threat": 0.30,
    "temporal": 0.20,
    "host": 0.15,
    "attack_stage": 0.20,
    "anomaly": 0.15,
}


def calculate_state_risk(state: NetworkState, stage: AttackStage) -> float:
    behavior_score = max(state.scan_score, state.beacon_score, state.exfiltration_score)
    volume_score = min(1.0, state.bytes_total / 100_000_000.0)
    fanout_score = min(1.0, max(state.port_fanout, state.host_fanout) / 100.0)
    stage_score = STAGE_SEVERITY[stage]
    return round(min(1.0, 0.40 * behavior_score + 0.20 * volume_score + 0.20 * fanout_score + 0.20 * stage_score), 4)


def calculate_risk_level(score_0_to_100: int) -> RiskLevel:
    if score_0_to_100 >= 81:
        return RiskLevel.CRITICAL
    if score_0_to_100 >= 61:
        return RiskLevel.HIGH
    if score_0_to_100 >= 31:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


def score_composite_risk(states: list[NetworkState]) -> dict[str, object]:
    """Weighted 0-100 score. Weights always sum to 1.0."""
    if not states:
        return {"status": "NO_DATA", "message": "No network states available for risk scoring"}

    from backend.training.create_sequences import infer_attack_stage

    latest = states[-1]
    stage = infer_attack_stage(latest)
    current = calculate_state_risk(latest, stage)
    host = min(1.0, max(latest.port_fanout, latest.host_fanout) / 100.0)
    anomaly = max(latest.scan_score, latest.beacon_score, latest.exfiltration_score)
    stage_score = STAGE_SEVERITY[stage]
    temporal = _temporal_score(states)
    components = {
        "current_threat": current,
        "temporal": temporal,
        "host": host,
        "attack_stage": stage_score,
        "anomaly": anomaly,
    }
    blended = sum(components[name] * weight for name, weight in COMPONENT_WEIGHTS.items())
    score = int(round(min(1.0, blended) * 100))
    return {
        "status": "success",
        "score": score,
        "risk_score": score,
        "level": calculate_risk_level(score).value,
        "risk_level": calculate_risk_level(score).value,
        "bands": {"LOW": "0-30", "MEDIUM": "31-60", "HIGH": "61-80", "CRITICAL": "81-100"},
        "stage": stage.value,
        "formula": "0.30*current + 0.20*temporal + 0.15*host + 0.20*stage + 0.15*anomaly",
        "components": [
            {
                "name": name,
                "weight": weight,
                "raw_score": int(round(components[name] * 100)),
                "points": int(round(components[name] * weight * 100)),
            }
            for name, weight in COMPONENT_WEIGHTS.items()
        ],
    }


def _temporal_score(states: list[NetworkState]) -> float:
    from backend.training.create_sequences import infer_attack_stage

    latest = calculate_state_risk(states[-1], infer_attack_stage(states[-1]))
    if len(states) < 2:
        return latest
    window = states[-5:]
    scored = [calculate_state_risk(state, infer_attack_stage(state)) for state in window]
    trend = (scored[-1] - scored[0]) / max(len(scored) - 1, 1)
    return round(min(1.0, max(0.0, latest + max(0.0, trend) * 2.0)), 4)
