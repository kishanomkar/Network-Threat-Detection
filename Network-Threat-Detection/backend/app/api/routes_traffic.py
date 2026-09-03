"""Traffic & Flow analytics API route."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

import pandas as pd

from backend.app.schemas import DatasetKind
from backend.data_adapters import get_adapter


router = APIRouter(prefix="/api/traffic", tags=["traffic-analysis"])


class TrafficAnalysisRequest(BaseModel):
    path: str
    dataset: DatasetKind = DatasetKind.GENERIC_CSV
    scenario: str = "sih-traffic-demo"
    capture_id: str = "local"
    max_records: int = Field(default=10000, ge=1, le=250000)


@router.post("/analysis")
def traffic_analysis(request: TrafficAnalysisRequest) -> dict[str, object]:
    adapter = get_adapter(request.dataset)
    try:
        result = adapter.load(request.path)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=400, detail=f"Input file not found: {request.path}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    df = result.records.head(request.max_records)
    if df.empty:
        return {
            "status": "NO_DATA",
            "message": "No traffic records available in the capture file",
            "warnings": result.warnings,
        }

    # 1. Calculate time span
    try:
        ts = df["timestamp"]
        duration_sec = max(1.0, (ts.max() - ts.min()).total_seconds())
    except Exception:
        duration_sec = 60.0

    total_packets = int(df["packet_count"].sum()) if "packet_count" in df.columns else len(df)
    total_bytes = int(df["byte_count"].sum()) if "byte_count" in df.columns else 0
    total_flows = len(df)

    packets_per_sec = round(total_packets / duration_sec, 1)
    bytes_per_sec = round(total_bytes / duration_sec, 1)
    flows_per_sec = round(total_flows / duration_sec, 1)

    unique_src = set(df["src_ip"].dropna().unique())
    unique_dst = set(df["dst_ip"].dropna().unique())
    active_hosts = len(unique_src.union(unique_dst))

    # 2. Protocol Distribution
    proto_counts = df["protocol"].value_counts(normalize=True) * 100
    colors = {
        "TCP": "#06b6d4",
        "UDP": "#3b82f6",
        "ICMP": "#f59e0b",
        "OTHERS": "#64748b",
    }
    protocol_data: list[dict[str, Any]] = []
    known_protos = ["TCP", "UDP", "ICMP"]
    other_val = 0.0

    for proto, pct in proto_counts.items():
        proto_str = str(proto).upper()
        if proto_str in known_protos:
            protocol_data.append({
                "name": proto_str,
                "value": round(float(pct), 1),
                "color": colors.get(proto_str, "#64748b")
            })
        else:
            other_val += float(pct)

    if other_val > 0:
        protocol_data.append({
            "name": "Others",
            "value": round(other_val, 1),
            "color": colors["OTHERS"]
        })

    # Sort so top protocols appear first
    protocol_data.sort(key=lambda x: x["value"], reverse=True)

    # 3. Top Destination Ports
    dst_ports = df["dst_port"].dropna()
    top_ports_series = dst_ports.value_counts().head(6)
    port_data = [
        {"port": str(int(p)), "count": int(c)}
        for p, c in top_ports_series.items()
    ]
    if not port_data:
        port_data = [
            {"port": "80", "count": 0},
            {"port": "443", "count": 0},
            {"port": "53", "count": 0},
        ]

    # 4. Recent Flow Records (tail or head formatted)
    recent_df = df.tail(10).iloc[::-1]
    flows: list[dict[str, Any]] = []
    for _, row in recent_df.iterrows():
        try:
            t_str = row["timestamp"].strftime("%H:%M:%S")
        except Exception:
            t_str = "12:00:00"

        b_val = row.get("byte_count", 0)
        if b_val >= 1_000_000:
            b_fmt = f"{b_val / 1_000_000:.1f} MB"
        elif b_val >= 1_000:
            b_fmt = f"{b_val / 1_000:.1f} KB"
        else:
            b_fmt = f"{b_val} B"

        p_val = row.get("dst_port")
        port_str = str(int(p_val)) if pd.notna(p_val) else "N/A"

        # Basic risk heuristic per flow
        syn_c = row.get("syn_count", 0)
        bytes_c = row.get("byte_count", 0)
        if syn_c > 5 or bytes_c > 10_000_000:
            risk_str = "High"
        elif syn_c > 1 or bytes_c > 1_000_000:
            risk_str = "Medium"
        else:
            risk_str = "Low"

        flows.append({
            "time": t_str,
            "src": str(row.get("src_ip", "10.0.0.1")),
            "dst": str(row.get("dst_ip", "10.0.0.2")),
            "proto": str(row.get("protocol", "TCP")).upper(),
            "port": port_str,
            "pkts": int(row.get("packet_count", 1)),
            "bytes": b_fmt,
            "risk": risk_str,
        })

    return {
        "status": "success",
        "packets_per_sec": packets_per_sec,
        "bytes_per_sec": bytes_per_sec,
        "flows_per_sec": flows_per_sec,
        "total_packets": total_packets,
        "total_bytes": total_bytes,
        "total_flows": total_flows,
        "active_hosts": active_hosts,
        "protocol_data": protocol_data,
        "port_data": port_data,
        "flows": flows,
        "dataset": result.dataset,
        "warnings": result.warnings,
    }
