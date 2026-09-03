"""Behavioral feature extraction for time-windowed network records."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd


@dataclass(frozen=True)
class BehaviorFeatures:
    connection_frequency: float
    destination_frequency: float
    repeated_connection_interval_ms: float
    packet_burst_rate: float
    port_diversity: float
    sequential_port_score: float
    random_port_score: float
    syn_ack_ratio: float
    scan_score: float
    beacon_score: float
    outbound_bytes: float
    inbound_bytes: float
    outbound_inbound_ratio: float
    large_transfer_count: int
    exfiltration_score: float

    def as_dict(self) -> dict[str, Any]:
        return self.__dict__.copy()


def _numeric(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce").dropna()


def _safe_ratio(numerator: float, denominator: float) -> float:
    return 0.0 if denominator <= 0 else float(numerator) / float(denominator)


def _clip01(value: float) -> float:
    return float(max(0.0, min(1.0, value)))


def calculate_behavior_features(records: pd.DataFrame, *, window_seconds: int, internal_prefixes: tuple[str, ...] = ()) -> BehaviorFeatures:
    """Calculate behavior signals from records inside a single state window."""
    if records.empty:
        return BehaviorFeatures(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)

    connection_frequency = len(records) / max(window_seconds, 1)
    destination_frequency = records["dst_ip"].nunique() / max(window_seconds, 1)
    repeated_interval = _repeated_connection_interval_ms(records)
    packet_burst_rate = _packet_burst_rate(records, window_seconds=window_seconds)
    port_diversity = float(records["dst_port"].dropna().nunique())
    sequential_score, random_score = _port_sequence_scores(records)
    syn_total = float(_numeric(records["syn_count"]).sum())
    ack_total = float(_numeric(records["ack_count"]).sum())
    syn_ack_ratio = _safe_ratio(syn_total, ack_total)
    outbound_bytes, inbound_bytes = _directional_bytes(records, internal_prefixes=internal_prefixes)
    byte_values = _numeric(records["byte_count"])
    large_threshold = max(float(byte_values.quantile(0.95)) if not byte_values.empty else 0.0, 1_000_000.0)
    large_transfer_count = int((byte_values >= large_threshold).sum())
    outbound_inbound_ratio = _safe_ratio(outbound_bytes, inbound_bytes)

    scan_score = calculate_scan_score(
        unique_destinations=float(records["dst_ip"].nunique()),
        port_diversity=port_diversity,
        sequential_port_score=sequential_score,
        random_port_score=random_score,
        syn_ack_ratio=syn_ack_ratio,
    )
    beacon_score = calculate_beacon_score(repeated_interval, _iat_std_ms(records))
    exfiltration_score = calculate_exfiltration_score(outbound_inbound_ratio, large_transfer_count, outbound_bytes)

    return BehaviorFeatures(
        connection_frequency=connection_frequency,
        destination_frequency=destination_frequency,
        repeated_connection_interval_ms=repeated_interval,
        packet_burst_rate=packet_burst_rate,
        port_diversity=port_diversity,
        sequential_port_score=sequential_score,
        random_port_score=random_score,
        syn_ack_ratio=syn_ack_ratio,
        scan_score=scan_score,
        beacon_score=beacon_score,
        outbound_bytes=outbound_bytes,
        inbound_bytes=inbound_bytes,
        outbound_inbound_ratio=outbound_inbound_ratio,
        large_transfer_count=large_transfer_count,
        exfiltration_score=exfiltration_score,
    )


def calculate_scan_score(
    *,
    unique_destinations: float,
    port_diversity: float,
    sequential_port_score: float,
    random_port_score: float,
    syn_ack_ratio: float,
) -> float:
    fanout_component = _clip01(unique_destinations / 50.0)
    port_component = _clip01(port_diversity / 100.0)
    failure_component = _clip01(syn_ack_ratio / 5.0)
    return round(_clip01(0.30 * fanout_component + 0.25 * port_component + 0.25 * sequential_port_score + 0.10 * random_port_score + 0.10 * failure_component), 4)


def calculate_beacon_score(repeated_connection_interval_ms: float, iat_std_ms: float) -> float:
    if repeated_connection_interval_ms <= 0:
        return 0.0
    regularity = 1.0 - _clip01(iat_std_ms / max(repeated_connection_interval_ms, 1.0))
    return round(_clip01(regularity), 4)


def calculate_exfiltration_score(outbound_inbound_ratio: float, large_transfer_count: int, outbound_bytes: float) -> float:
    ratio_component = _clip01(outbound_inbound_ratio / 10.0)
    transfer_component = _clip01(large_transfer_count / 10.0)
    volume_component = _clip01(outbound_bytes / 100_000_000.0)
    return round(_clip01(0.45 * ratio_component + 0.35 * transfer_component + 0.20 * volume_component), 4)


def _repeated_connection_interval_ms(records: pd.DataFrame) -> float:
    pairs = records.dropna(subset=["src_ip", "dst_ip"]).sort_values("timestamp")
    intervals: list[float] = []
    for _, group in pairs.groupby(["src_ip", "dst_ip"], sort=False):
        if len(group) < 2:
            continue
        deltas = group["timestamp"].diff().dropna().dt.total_seconds().mul(1000)
        intervals.extend(deltas.tolist())
    return float(np.median(intervals)) if intervals else 0.0


def _packet_burst_rate(records: pd.DataFrame, *, window_seconds: int) -> float:
    timestamps = records["timestamp"].dropna()
    if timestamps.empty:
        return 0.0
    per_second = timestamps.dt.floor("s").value_counts()
    return float(per_second.max()) / max(window_seconds, 1)


def _port_sequence_scores(records: pd.DataFrame) -> tuple[float, float]:
    scores: list[float] = []
    random_scores: list[float] = []
    valid = records.dropna(subset=["src_ip", "dst_port"]).sort_values("timestamp")
    for _, group in valid.groupby("src_ip", sort=False):
        ports = _numeric(group["dst_port"]).astype(int).tolist()
        if len(ports) < 3:
            continue
        diffs = np.diff(ports)
        sequential = float(np.mean(np.abs(diffs) == 1))
        unique_ratio = len(set(ports)) / len(ports)
        scores.append(sequential)
        random_scores.append(float(unique_ratio * (1.0 - sequential)))
    return (
        round(float(np.mean(scores)), 4) if scores else 0.0,
        round(float(np.mean(random_scores)), 4) if random_scores else 0.0,
    )


def _iat_std_ms(records: pd.DataFrame) -> float:
    supplied = _numeric(records["iat_std_ms"])
    if not supplied.empty:
        return float(supplied.mean())
    timestamps = records["timestamp"].sort_values()
    if len(timestamps) < 3:
        return 0.0
    return float(timestamps.diff().dropna().dt.total_seconds().mul(1000).std(ddof=0))


def _directional_bytes(records: pd.DataFrame, *, internal_prefixes: tuple[str, ...]) -> tuple[float, float]:
    bytes_series = pd.to_numeric(records["byte_count"], errors="coerce").fillna(0.0)
    if not internal_prefixes:
        return float(bytes_series.sum()), 0.0
    src_internal = records["src_ip"].astype(str).str.startswith(internal_prefixes)
    dst_internal = records["dst_ip"].astype(str).str.startswith(internal_prefixes)
    outbound = float(bytes_series[src_internal & ~dst_internal].sum())
    inbound = float(bytes_series[~src_internal & dst_internal].sum())
    return outbound, inbound

