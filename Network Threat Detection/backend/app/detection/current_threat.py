"""Current-window threat detection for the SIH vertical-slice workflow."""

from __future__ import annotations

from backend.app.explainability import generate_evidence
from backend.app.risk import calculate_risk_level, calculate_state_risk
from backend.app.schemas import NetworkState
from backend.training.create_sequences import infer_attack_probability, infer_attack_stage


def detect_current_threat(states: list[NetworkState]) -> dict[str, object]:
    if not states:
        return {
            "status": "NO_DATA",
            "message": "No network states could be generated from the supplied traffic",
        }

    latest = states[-1]
    stage = infer_attack_stage(latest)
    risk = int(round(calculate_state_risk(latest, stage) * 100))
    confidence = int(round(max(infer_attack_probability(latest), risk / 100) * 100))
    evidence, top_features = generate_evidence(states)

    return {
        "status": "success",
        "current_status": _status_from_score(risk, stage.value),
        "current_attack": stage.value,
        "current_risk": risk,
        "current_risk_level": calculate_risk_level(risk).value,
        "confidence": confidence,
        "evidence": evidence,
        "top_features": top_features,
        "latest_state": {
            "state_id": latest.state_id,
            "timestamp": latest.timestamp.isoformat(),
            "flow_count": latest.flow_count,
            "packet_count": latest.packet_count,
            "unique_sources": latest.unique_sources,
            "unique_destinations": latest.unique_destinations,
            "unique_ports": latest.unique_ports,
            "bytes_total": latest.bytes_total,
            "scan_score": latest.scan_score,
            "beacon_score": latest.beacon_score,
            "exfiltration_score": latest.exfiltration_score,
        },
    }


def _status_from_score(score: int, stage: str) -> str:
    if score >= 61:
        return "ATTACK"
    if score >= 31 or stage.lower() not in {"benign", "normal"}:
        return "SUSPICIOUS"
    return "NORMAL"
