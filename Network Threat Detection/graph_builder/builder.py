"""Construction of one directed host-communication graph per network state."""

from __future__ import annotations

from collections import Counter
from typing import Any

import pandas as pd


def _nullable_sum(values: pd.Series) -> float | None:
    numeric = pd.to_numeric(values, errors="coerce").dropna()
    return None if numeric.empty else float(numeric.sum())


def _nullable_mean(values: pd.Series) -> float | None:
    numeric = pd.to_numeric(values, errors="coerce").dropna()
    return None if numeric.empty else float(numeric.mean())


def _integer_or_none(value: float | None) -> int | None:
    return None if value is None else int(round(value))


def _host_id(ip_address: str) -> str:
    return f"host:{ip_address}"


def build_graph_state(state: dict[str, Any], records: pd.DataFrame) -> dict[str, Any]:
    """Return the graph that is reconstructable from one state window's records."""
    valid = records.dropna(subset=["src_ip", "dst_ip"])
    raw_edges: list[dict[str, Any]] = []
    for (src_ip, dst_ip), edge_records in valid.groupby(["src_ip", "dst_ip"], sort=True):
        ports = sorted({int(port) for port in edge_records["dst_port"].dropna()})
        raw_edges.append(
            {
                "source": _host_id(str(src_ip)),
                "target": _host_id(str(dst_ip)),
                "packet_count": _nullable_sum(edge_records["packet_count"]),
                "byte_count": _nullable_sum(edge_records["byte_count"]),
                "flow_count": int(len(edge_records)),
                "protocol_counts": dict(Counter(edge_records["protocol"].astype(str))),
                "dst_ports": ports,
                "syn_count": _integer_or_none(_nullable_sum(edge_records["syn_count"])),
                "mean_iat_ms": _nullable_mean(edge_records["iat_mean_ms"]),
            }
        )

    host_ids = sorted({_host_id(str(ip)) for ip in pd.concat([valid["src_ip"], valid["dst_ip"]]).unique()})
    nodes: list[dict[str, Any]] = []
    for host_id in host_ids:
        outgoing = [edge for edge in raw_edges if edge["source"] == host_id]
        incoming = [edge for edge in raw_edges if edge["target"] == host_id]
        nodes.append(
            {
                "id": host_id,
                "ip_address": host_id.removeprefix("host:"),
                "in_degree": len(incoming),
                "out_degree": len(outgoing),
                "bytes_sent": _nullable_sum(pd.Series([edge["byte_count"] for edge in outgoing], dtype="float64")),
                "bytes_received": _nullable_sum(pd.Series([edge["byte_count"] for edge in incoming], dtype="float64")),
                "role_hint": "unknown",
            }
        )

    return {
        "schema_version": "1.0",
        "state_id": state["state_id"],
        "timestamp": state["timestamp"],
        "window_seconds": state["window_seconds"],
        "nodes": nodes,
        "edges": raw_edges,
    }
