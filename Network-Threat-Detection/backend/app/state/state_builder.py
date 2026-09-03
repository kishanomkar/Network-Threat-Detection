"""Bridge Person 1 state artifacts into the backend NetworkState contract."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

import pandas as pd

from backend.app.features import calculate_behavior_features
from backend.app.schemas import NetworkState, StateSource
from data_pipeline.preprocessing import STATE_VECTOR_PATHS, states_to_matrix
from data_pipeline.states import iter_windowed_states


def _number(value: Any) -> float:
    if value is None:
        return 0.0
    try:
        result = float(value)
    except (TypeError, ValueError):
        return 0.0
    return 0.0 if pd.isna(result) else result


def _integer(value: Any) -> int:
    return int(round(_number(value)))


def _rate(count: Any, denominator: Any) -> float:
    total = _number(denominator)
    return 0.0 if total <= 0 else _number(count) / total


def _score(value: float, threshold: float) -> float:
    if threshold <= 0:
        return 0.0
    return max(0.0, min(1.0, value / threshold))


def legacy_state_to_canonical(state: dict[str, Any]) -> NetworkState:
    """Convert the existing Person 1 JSON shape to the Phase 2 schema."""
    traffic = state.get("traffic_features", {})
    flags = traffic.get("tcp_flag_counts", {})
    timing = traffic.get("timing", {})
    packet_metadata = traffic.get("packet_metadata", {})
    timestamp = datetime.fromisoformat(str(state["timestamp"]).replace("Z", "+00:00"))
    window_seconds = int(state["window_seconds"])
    packet_count = _number(traffic.get("packet_count"))
    byte_count = _number(traffic.get("byte_count"))
    protocol_counts = {str(key): int(value) for key, value in traffic.get("protocol_counts", {}).items()}
    feature_vector = states_to_matrix([state])[0].tolist()

    return NetworkState(
        state_id=str(state["state_id"]),
        timestamp=timestamp,
        window_start=timestamp,
        window_end=timestamp + timedelta(seconds=window_seconds),
        window_seconds=window_seconds,
        source=StateSource(**state["source"]),
        flow_count=_integer(traffic.get("flow_count")),
        packet_count=packet_count,
        unique_sources=_integer(traffic.get("unique_src_ips")),
        unique_destinations=_integer(traffic.get("unique_dst_ips")),
        unique_ports=_integer(traffic.get("unique_dst_ports")),
        bytes_total=byte_count,
        packets_total=packet_count,
        syn_rate=_number(traffic.get("syn_rate")),
        ack_rate=_rate(flags.get("ack"), packet_count),
        rst_rate=_rate(flags.get("rst"), packet_count),
        mean_iat=_number(timing.get("mean_iat_ms")),
        iat_std=_number(timing.get("std_iat_ms")),
        port_fanout=_integer(traffic.get("port_fanout")),
        host_fanout=_integer(traffic.get("unique_dst_ips")),
        scan_score=_score(_number(traffic.get("port_fanout")), 25.0),
        beacon_score=max(0.0, min(1.0, 1.0 - _score(_number(timing.get("std_iat_ms")), 1000.0))),
        exfiltration_score=_score(_number(traffic.get("bytes_per_second")), 1_000_000.0),
        ttl_mean=_number(packet_metadata.get("mean_ttl")),
        ttl_std=_number(packet_metadata.get("ttl_std")),
        packet_size_mean=_number(packet_metadata.get("mean_packet_size")),
        packet_size_std=0.0,
        outbound_bytes=byte_count,
        inbound_bytes=0.0,
        protocol_distribution=protocol_counts,
        feature_vector=feature_vector,
        raw_state=state,
    )


def build_canonical_states(
    records: pd.DataFrame,
    *,
    window_seconds: int,
    dataset: str,
    scenario: str,
    capture_id: str,
    split: str | None = None,
) -> list[NetworkState]:
    """Create canonical states directly from normalized traffic records."""
    states = []
    for state, window_records in iter_windowed_states(
        records,
        window_seconds=window_seconds,
        dataset=dataset,
        scenario=scenario,
        capture_id=capture_id,
        split=split,
    ):
        canonical = legacy_state_to_canonical(state)
        behavior = calculate_behavior_features(window_records, window_seconds=window_seconds)
        canonical.scan_score = behavior.scan_score
        canonical.beacon_score = behavior.beacon_score
        canonical.exfiltration_score = behavior.exfiltration_score
        canonical.outbound_bytes = behavior.outbound_bytes
        canonical.inbound_bytes = behavior.inbound_bytes
        states.append(canonical)
    return states


def state_feature_names() -> list[str]:
    return list(STATE_VECTOR_PATHS)
