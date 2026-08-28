"""Flow-level feature summaries for canonical traffic records."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import pandas as pd


@dataclass(frozen=True)
class FlowFeatures:
    flow_count: int
    byte_count: float
    packet_count: float
    packets_per_second: float
    bytes_per_second: float
    mean_duration_ms: float
    forward_backward_byte_ratio: float
    protocol_counts: dict[str, int]
    syn_count: int
    ack_count: int
    fin_count: int
    rst_count: int
    psh_count: int
    urg_count: int

    def as_dict(self) -> dict[str, Any]:
        return self.__dict__.copy()


def calculate_flow_features(records: pd.DataFrame, *, window_seconds: int) -> FlowFeatures:
    packet_count = _sum(records, "packet_count")
    byte_count = _sum(records, "byte_count")
    bwd_bytes = _sum(records, "bwd_byte_count") if "bwd_byte_count" in records.columns else 0.0
    fwd_bytes = max(byte_count - bwd_bytes, 0.0) if bwd_bytes else byte_count
    protocol_counts = records["protocol"].astype(str).value_counts().sort_index().to_dict() if "protocol" in records else {}

    return FlowFeatures(
        flow_count=int(len(records)),
        byte_count=byte_count,
        packet_count=packet_count,
        packets_per_second=packet_count / max(window_seconds, 1),
        bytes_per_second=byte_count / max(window_seconds, 1),
        mean_duration_ms=_mean(records, "flow_duration_ms"),
        forward_backward_byte_ratio=_ratio(fwd_bytes, bwd_bytes),
        protocol_counts={str(key): int(value) for key, value in protocol_counts.items()},
        syn_count=int(round(_sum(records, "syn_count"))),
        ack_count=int(round(_sum(records, "ack_count"))),
        fin_count=int(round(_sum(records, "fin_count"))),
        rst_count=int(round(_sum(records, "rst_count"))),
        psh_count=int(round(_sum(records, "psh_count"))),
        urg_count=int(round(_sum(records, "urg_count"))),
    )


def _sum(records: pd.DataFrame, column: str) -> float:
    if column not in records:
        return 0.0
    return float(pd.to_numeric(records[column], errors="coerce").fillna(0.0).sum())


def _mean(records: pd.DataFrame, column: str) -> float:
    if column not in records:
        return 0.0
    values = pd.to_numeric(records[column], errors="coerce").dropna()
    return 0.0 if values.empty else float(values.mean())


def _ratio(numerator: float, denominator: float) -> float:
    return 0.0 if denominator <= 0 else float(numerator) / float(denominator)

