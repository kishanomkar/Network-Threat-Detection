"""Generate simple, data-backed explanation statements."""

from __future__ import annotations

from backend.app.schemas import NetworkState


def generate_evidence(states: list[NetworkState]) -> tuple[list[str], list[str]]:
    if not states:
        return [], []
    latest = states[-1]
    previous = states[-2] if len(states) >= 2 else None
    evidence: list[str] = []
    top_features: list[str] = []

    _add_if(evidence, top_features, latest.scan_score >= 0.35, "High scan-like behavior from destination/port fan-out", "scan_score")
    _add_if(evidence, top_features, latest.beacon_score >= 0.8, "Regular repeated timing pattern suggests possible beaconing", "beacon_score")
    _add_if(evidence, top_features, latest.exfiltration_score >= 0.35, "Outbound transfer pattern is elevated", "exfiltration_score")
    _add_if(evidence, top_features, latest.syn_rate >= 0.30, "SYN activity is elevated in the latest window", "syn_rate")
    _add_if(evidence, top_features, latest.host_fanout >= 20, "One or more hosts contacted many destinations", "host_fanout")
    _add_if(evidence, top_features, latest.port_fanout >= 20, "One or more hosts contacted many destination ports", "port_fanout")

    if previous is not None:
        _add_if(
            evidence,
            top_features,
            latest.bytes_total > previous.bytes_total * 1.5 and latest.bytes_total > 0,
            "Traffic volume increased sharply compared with the previous window",
            "bytes_total",
        )
        _add_if(
            evidence,
            top_features,
            latest.unique_destinations > previous.unique_destinations,
            "Destination diversity is increasing over time",
            "unique_destinations",
        )

    if not evidence:
        evidence.append("No strong suspicious progression signal in the current state sequence")
        top_features.append("baseline_behavior")
    return evidence[:5], top_features[:5]


def _add_if(evidence: list[str], top_features: list[str], condition: bool, message: str, feature: str) -> None:
    if condition:
        evidence.append(message)
        top_features.append(feature)

