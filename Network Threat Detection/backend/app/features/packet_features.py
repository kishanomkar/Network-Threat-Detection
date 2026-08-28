"""Packet-level feature summaries for canonical traffic records."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import pandas as pd


@dataclass(frozen=True)
class PacketFeatures:
    ttl_mean: float
    ttl_variance: float
    packet_size_mean: float
    packet_size_variance: float
    tcp_window_size_mean: float
    retransmission_count: int
    fragmentation_count: int
    packet_timing_mean_ms: float
    packet_timing_std_ms: float
    protocol_distribution: dict[str, float]

    def as_dict(self) -> dict[str, Any]:
        return self.__dict__.copy()


def calculate_packet_features(records: pd.DataFrame) -> PacketFeatures:
    protocol_counts = records["protocol"].astype(str).value_counts().sort_index().to_dict() if "protocol" in records else {}
    total_protocols = max(sum(protocol_counts.values()), 1)
    return PacketFeatures(
        ttl_mean=_mean(records, "ttl"),
        ttl_variance=_variance(records, "ttl"),
        packet_size_mean=_mean(records, "byte_count"),
        packet_size_variance=_variance(records, "byte_count"),
        tcp_window_size_mean=_mean(records, "tcp_window_size"),
        retransmission_count=int(round(_sum(records, "retransmission_count"))),
        fragmentation_count=int(round(_sum(records, "fragment_count"))),
        packet_timing_mean_ms=_mean(records, "iat_mean_ms"),
        packet_timing_std_ms=_mean(records, "iat_std_ms"),
        protocol_distribution={str(key): float(value) / total_protocols for key, value in protocol_counts.items()},
    )


def _series(records: pd.DataFrame, column: str) -> pd.Series:
    if column not in records:
        return pd.Series(dtype="float64")
    return pd.to_numeric(records[column], errors="coerce").dropna()


def _sum(records: pd.DataFrame, column: str) -> float:
    values = _series(records, column)
    return 0.0 if values.empty else float(values.sum())


def _mean(records: pd.DataFrame, column: str) -> float:
    values = _series(records, column)
    return 0.0 if values.empty else float(values.mean())


def _variance(records: pd.DataFrame, column: str) -> float:
    values = _series(records, column)
    return 0.0 if values.empty else float(values.var(ddof=0))

