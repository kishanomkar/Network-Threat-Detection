"""Build analyst-ready investigation cases from completed feature outputs."""

from __future__ import annotations

from typing import Any


def build_investigation_case(
    *,
    detection: dict[str, Any],
    forecast: dict[str, Any],
    graph: dict[str, Any],
    timeline: dict[str, Any],
) -> dict[str, object]:
    top_hosts = (graph.get("summary") or {}).get("top_nodes", [])[:5]
    top_edges = (graph.get("summary") or {}).get("top_edges", [])[:5]
    evidence = list(dict.fromkeys((detection.get("evidence") or []) + (forecast.get("evidence") or [])))
    risk = max(int(detection.get("current_risk", 0)), int(forecast.get("future_risk", 0)))

    return {
        "status": "success",
        "case_id": f"case-{detection.get('dataset', 'traffic')}-{detection.get('state_count', 0)}",
        "priority": _priority(risk),
        "risk_score": risk,
        "current_attack": detection.get("current_attack"),
        "predicted_stage": forecast.get("predicted_stage"),
        "stage_path": timeline.get("stage_path", []),
        "suspect_hosts": [{"host": node.get("name"), "risk": node.get("risk")} for node in top_hosts],
        "suspicious_connections": [
            {"source": edge.get("source"), "target": edge.get("target"), "confidence": edge.get("confidence")}
            for edge in top_edges
        ],
        "evidence": evidence[:6],
        "recommended_actions": _actions(risk, detection.get("current_attack"), forecast.get("predicted_stage")),
    }


def _priority(risk: int) -> str:
    if risk >= 81:
        return "CRITICAL"
    if risk >= 61:
        return "HIGH"
    if risk >= 31:
        return "MEDIUM"
    return "LOW"


def _actions(risk: int, current_attack: object, predicted_stage: object) -> list[str]:
    actions = ["Review top communicating hosts", "Correlate source IPs with firewall and IDS logs"]
    if risk >= 31 or str(current_attack).lower() not in {"benign", "normal", "none"}:
        actions.append("Increase monitoring on suspect hosts")
    if predicted_stage and str(predicted_stage).lower() not in {"benign", "normal"}:
        actions.append(f"Prepare response for possible {predicted_stage} progression")
    return actions
