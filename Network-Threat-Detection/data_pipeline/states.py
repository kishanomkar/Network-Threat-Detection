"""Aggregation of canonical traffic records into leakage-safe network states."""

from __future__ import annotations

from collections import Counter
from collections.abc import Iterator
from typing import Any

import pandas as pd


def _nullable_sum(values: pd.Series) -> float | None:
    numeric = pd.to_numeric(values, errors="coerce").dropna()
    return None if numeric.empty else float(numeric.sum())


def _nullable_mean(values: pd.Series) -> float | None:
    numeric = pd.to_numeric(values, errors="coerce").dropna()
    return None if numeric.empty else float(numeric.mean())


def _nullable_std(values: pd.Series) -> float | None:
    numeric = pd.to_numeric(values, errors="coerce").dropna()
    return None if numeric.empty else float(numeric.std(ddof=0))


def _nullable_max(values: pd.Series) -> float | None:
    numeric = pd.to_numeric(values, errors="coerce").dropna()
    return None if numeric.empty else float(numeric.max())


def _integer_or_none(value: float | None) -> int | None:
    return None if value is None else int(round(value))


def _inter_arrival_stats(records: pd.DataFrame) -> tuple[float | None, float | None, float | None]:
    supplied = (
        _nullable_mean(records["iat_mean_ms"]),
        _nullable_mean(records["iat_std_ms"]),
        _nullable_max(records["iat_max_ms"]),
    )
    if any(value is not None for value in supplied):
        return supplied

    timestamps = records["timestamp"].sort_values()
    differences = timestamps.diff().dropna().dt.total_seconds().mul(1000)
    return _nullable_mean(differences), _nullable_std(differences), _nullable_max(differences)


def _isoformat(timestamp: pd.Timestamp) -> str:
    return timestamp.isoformat().replace("+00:00", "Z")


def _ground_truth(records: pd.DataFrame) -> dict[str, str] | None:
    labels = records["label"].dropna().astype(str).str.strip()
    labels = labels[labels != ""]
    if labels.empty:
        return None
    unique_labels = labels.unique()
    return {"current_label": unique_labels[0] if len(unique_labels) == 1 else "MIXED"}


def _port_fanout(records: pd.DataFrame) -> int:
    valid = records.dropna(subset=["src_ip", "dst_port"])
    if valid.empty:
        return 0
    return int(valid.groupby("src_ip")["dst_port"].nunique().max())


def _feature_availability(traffic_features: dict[str, Any]) -> dict[str, bool]:
    availability: dict[str, bool] = {}
    for name, value in traffic_features.items():
        if isinstance(value, dict):
            for nested_name, nested_value in value.items():
                availability[f"{name}.{nested_name}"] = nested_value is not None
        else:
            availability[name] = value is not None
    return availability


def build_network_state(
    records: pd.DataFrame,
    *,
    window_start: pd.Timestamp,
    window_seconds: int,
    dataset: str,
    scenario: str,
    capture_id: str,
    split: str | None,
) -> dict[str, Any]:
    """Build one state using only records observed in the current time window."""
    packet_count = _nullable_sum(records["packet_count"])
    byte_count = _nullable_sum(records["byte_count"])
    syn_count = _integer_or_none(_nullable_sum(records["syn_count"]))
    ack_count = _integer_or_none(_nullable_sum(records["ack_count"]))
    fin_count = _integer_or_none(_nullable_sum(records["fin_count"]))
    rst_count = _integer_or_none(_nullable_sum(records["rst_count"]))
    psh_count = _integer_or_none(_nullable_sum(records["psh_count"]))
    urg_count = _integer_or_none(_nullable_sum(records["urg_count"]))
    mean_iat_ms, std_iat_ms, max_iat_ms = _inter_arrival_stats(records)
    mean_flow_duration_ms = _nullable_mean(records["flow_duration_ms"])
    max_flow_duration_ms = _nullable_max(records["flow_duration_ms"])

    traffic_features: dict[str, Any] = {
        "packet_count": packet_count,
        "flow_count": int(len(records)),
        "byte_count": byte_count,
        "packets_per_second": None if packet_count is None else packet_count / window_seconds,
        "bytes_per_second": None if byte_count is None else byte_count / window_seconds,
        "unique_src_ips": int(records["src_ip"].nunique()),
        "unique_dst_ips": int(records["dst_ip"].nunique()),
        "unique_src_ports": int(records["src_port"].dropna().nunique()),
        "unique_dst_ports": int(records["dst_port"].dropna().nunique()),
        "port_fanout": _port_fanout(records),
        "syn_rate": None if syn_count is None or not packet_count else syn_count / packet_count,
        "protocol_counts": dict(Counter(records["protocol"].astype(str))),
        "tcp_flag_counts": {
            "syn": syn_count,
            "ack": ack_count,
            "fin": fin_count,
            "rst": rst_count,
            "psh": psh_count,
            "urg": urg_count,
        },
        "timing": {
            "mean_iat_ms": mean_iat_ms,
            "std_iat_ms": std_iat_ms,
            "max_iat_ms": max_iat_ms,
            "mean_flow_duration_ms": mean_flow_duration_ms,
            "max_flow_duration_ms": max_flow_duration_ms,
        },
        "packet_metadata": {
            "mean_packet_size": _nullable_mean(records["byte_count"]),
            "mean_ttl": _nullable_mean(records["ttl"]),
            "ttl_std": _nullable_std(records["ttl"]),
            "mean_tcp_window_size": _nullable_mean(records["tcp_window_size"]),
            "retransmission_count": _integer_or_none(_nullable_sum(records["retransmission_count"])),
            "fragment_count": _integer_or_none(_nullable_sum(records["fragment_count"])),
        },
    }
    source = {"dataset": dataset, "scenario": scenario, "capture_id": capture_id}
    if split is not None:
        source["split"] = split
    state = {
        "schema_version": "1.0",
        "state_id": f"{dataset}:{scenario}:{window_start.strftime('%Y%m%dT%H%M%SZ')}",
        "source": source,
        "timestamp": _isoformat(window_start),
        "window_seconds": window_seconds,
        "traffic_features": traffic_features,
        "feature_availability": _feature_availability(traffic_features),
    }
    ground_truth = _ground_truth(records)
    if ground_truth is not None:
        state["ground_truth"] = ground_truth
    return state


def iter_windowed_states(
    records: pd.DataFrame,
    *,
    window_seconds: int,
    dataset: str,
    scenario: str,
    capture_id: str,
    split: str | None = None,
) -> Iterator[tuple[dict[str, Any], pd.DataFrame]]:
    """Yield chronological states paired with the records used to make each state."""
    if window_seconds < 1:
        raise ValueError("window_seconds must be at least 1")
    windowed = records.copy()
    windowed["_window_start"] = windowed["timestamp"].dt.floor(f"{window_seconds}s")
    for window_start, window_records in windowed.groupby("_window_start", sort=True):
        current_records = window_records.drop(columns="_window_start").reset_index(drop=True)
        yield (
            build_network_state(
                current_records,
                window_start=window_start,
                window_seconds=window_seconds,
                dataset=dataset,
                scenario=scenario,
                capture_id=capture_id,
                split=split,
            ),
            current_records,
        )
