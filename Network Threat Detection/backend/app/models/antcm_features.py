"""Feature schema and mapping helpers for the notebook-trained ANTCM model."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from backend.app.schemas import NetworkState


def load_antcm_feature_schema(project_root: str | Path) -> dict[str, Any]:
    schema_path = Path(project_root) / "configs" / "antcm_feature_schema.json"
    return json.loads(schema_path.read_text(encoding="utf-8"))


def network_state_to_antcm_features(state: NetworkState, schema: dict[str, Any]) -> list[float]:
    """Map one canonical NetworkState into ANTCM's CICFlowMeter-style vector.

    This is a compatibility bridge. Values that cannot be reconstructed from an
    aggregate state are deliberately set to zero instead of invented.
    """
    flags = state.raw_state.get("traffic_features", {}).get("tcp_flag_counts", {})
    mean_packet_size = state.packet_size_mean
    packet_count = state.packet_count
    bytes_total = state.bytes_total
    protocol = _dominant_protocol_number(state.protocol_distribution)
    values = {
        "Protocol": protocol,
        "Flow Duration": state.window_seconds * 1_000_000,
        "Total Fwd Packets": packet_count,
        "Total Backward Packets": 0.0,
        "Fwd Packets Length Total": bytes_total,
        "Bwd Packets Length Total": 0.0,
        "Fwd Packet Length Max": mean_packet_size,
        "Fwd Packet Length Min": 0.0,
        "Fwd Packet Length Mean": mean_packet_size,
        "Fwd Packet Length Std": state.packet_size_std,
        "Bwd Packet Length Max": 0.0,
        "Bwd Packet Length Min": 0.0,
        "Bwd Packet Length Mean": 0.0,
        "Bwd Packet Length Std": 0.0,
        "Flow Bytes/s": state.bytes_total / max(state.window_seconds, 1),
        "Flow Packets/s": state.packet_count / max(state.window_seconds, 1),
        "Flow IAT Mean": state.mean_iat,
        "Flow IAT Std": state.iat_std,
        "Flow IAT Max": state.raw_state.get("traffic_features", {}).get("timing", {}).get("max_iat_ms") or 0.0,
        "Flow IAT Min": 0.0,
        "Fwd IAT Total": state.mean_iat * max(packet_count - 1, 0),
        "Fwd IAT Mean": state.mean_iat,
        "Fwd IAT Std": state.iat_std,
        "Fwd IAT Max": state.raw_state.get("traffic_features", {}).get("timing", {}).get("max_iat_ms") or 0.0,
        "Fwd IAT Min": 0.0,
        "Bwd IAT Total": 0.0,
        "Bwd IAT Mean": 0.0,
        "Bwd IAT Std": 0.0,
        "Bwd IAT Max": 0.0,
        "Bwd IAT Min": 0.0,
        "Fwd PSH Flags": flags.get("psh") or 0.0,
        "Bwd PSH Flags": 0.0,
        "Fwd URG Flags": flags.get("urg") or 0.0,
        "Bwd URG Flags": 0.0,
        "Fwd Header Length": 0.0,
        "Bwd Header Length": 0.0,
        "Fwd Packets/s": state.packet_count / max(state.window_seconds, 1),
        "Bwd Packets/s": 0.0,
        "Packet Length Min": 0.0,
        "Packet Length Max": mean_packet_size,
        "Packet Length Mean": mean_packet_size,
        "Packet Length Std": state.packet_size_std,
        "Packet Length Variance": state.packet_size_std**2,
        "FIN Flag Count": flags.get("fin") or 0.0,
        "SYN Flag Count": flags.get("syn") or 0.0,
        "RST Flag Count": flags.get("rst") or 0.0,
        "PSH Flag Count": flags.get("psh") or 0.0,
        "ACK Flag Count": flags.get("ack") or 0.0,
        "URG Flag Count": flags.get("urg") or 0.0,
        "Down/Up Ratio": 0.0,
        "Avg Packet Size": mean_packet_size,
        "Avg Fwd Segment Size": mean_packet_size,
        "Avg Bwd Segment Size": 0.0,
        "Subflow Fwd Packets": packet_count,
        "Subflow Fwd Bytes": bytes_total,
        "Subflow Bwd Packets": 0.0,
        "Subflow Bwd Bytes": 0.0,
        "Init Fwd Win Bytes": state.raw_state.get("traffic_features", {}).get("packet_metadata", {}).get("mean_tcp_window_size") or 0.0,
        "Init Bwd Win Bytes": 0.0,
        "Fwd Act Data Packets": packet_count,
        "Fwd Seg Size Min": 0.0,
        "Idle Mean": state.mean_iat,
        "Idle Std": state.iat_std,
        "Idle Max": state.raw_state.get("traffic_features", {}).get("timing", {}).get("max_iat_ms") or 0.0,
    }
    return [float(values.get(name, 0.0) or 0.0) for name in schema["feature_names"]]


def _dominant_protocol_number(protocol_distribution: dict[str, int]) -> float:
    if not protocol_distribution:
        return 0.0
    protocol = max(protocol_distribution, key=protocol_distribution.get).upper()
    return {"TCP": 6.0, "UDP": 17.0, "ICMP": 1.0}.get(protocol, float(protocol) if protocol.isdigit() else 0.0)

