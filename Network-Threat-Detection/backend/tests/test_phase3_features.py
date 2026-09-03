from __future__ import annotations

import pandas as pd
import pytest

from backend.app.features import (
    calculate_behavior_features,
    calculate_dns_features,
    calculate_flow_features,
    calculate_packet_features,
    extract_feature_bundle,
)
from backend.app.state import build_canonical_states


def _records() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "timestamp": pd.to_datetime(
                [
                    "2026-01-01T00:00:00Z",
                    "2026-01-01T00:00:01Z",
                    "2026-01-01T00:00:02Z",
                    "2026-01-01T00:00:03Z",
                    "2026-01-01T00:00:04Z",
                ],
                utc=True,
            ),
            "src_ip": ["10.0.0.5"] * 5,
            "dst_ip": ["8.8.8.8", "8.8.4.4", "1.1.1.1", "9.9.9.9", "4.4.4.4"],
            "src_port": [40000, 40001, 40002, 40003, 40004],
            "dst_port": [20, 21, 22, 23, 24],
            "protocol": ["TCP"] * 5,
            "packet_count": [10, 10, 10, 10, 10],
            "byte_count": [2_000_000, 500, 600, 700, 800],
            "flow_duration_ms": [100, 100, 100, 100, 100],
            "syn_count": [10, 10, 10, 10, 10],
            "ack_count": [1, 1, 1, 1, 1],
            "fin_count": [0, 0, 0, 0, 0],
            "rst_count": [0, 0, 0, 0, 0],
            "psh_count": [0, 0, 0, 0, 0],
            "urg_count": [0, 0, 0, 0, 0],
            "iat_mean_ms": [1000, 1000, 1000, 1000, 1000],
            "iat_std_ms": [5, 5, 5, 5, 5],
            "iat_max_ms": [1000, 1000, 1000, 1000, 1000],
            "ttl": [64, 64, 64, 64, 64],
            "tcp_window_size": [1024, 1024, 1024, 1024, 1024],
            "retransmission_count": [0, 0, 0, 0, 0],
            "fragment_count": [0, 0, 0, 0, 0],
            "label": ["BENIGN"] * 5,
        }
    )


def test_behavior_features_detect_scan_like_window() -> None:
    features = calculate_behavior_features(_records(), window_seconds=10, internal_prefixes=("10.",))

    assert features.sequential_port_score == 1.0
    assert features.syn_ack_ratio == 10.0
    assert features.scan_score > 0.25
    assert features.outbound_bytes > 0
    assert features.exfiltration_score > 0


def test_dns_features_are_optional() -> None:
    disabled = calculate_dns_features(_records())
    enabled = calculate_dns_features(_records().assign(dns_query=["a.example.com", "b.example.com", None, "", "x123.test"]))

    assert disabled.enabled is False
    assert enabled.enabled is True
    assert enabled.query_count == 3
    assert enabled.mean_domain_entropy > 0


def test_flow_features_summarize_window() -> None:
    features = calculate_flow_features(_records(), window_seconds=10)

    assert features.flow_count == 5
    assert features.packet_count == 50
    assert features.syn_count == 50
    assert features.ack_count == 5
    assert features.protocol_counts == {"TCP": 5}


def test_packet_features_summarize_packet_metadata() -> None:
    features = calculate_packet_features(_records())

    assert features.ttl_mean == 64
    assert features.tcp_window_size_mean == 1024
    assert features.fragmentation_count == 0
    assert features.protocol_distribution == {"TCP": 1.0}
    assert features.packet_size_variance > 0


def test_combined_feature_bundle_contains_all_groups() -> None:
    bundle = extract_feature_bundle(_records(), window_seconds=10, internal_prefixes=("10.",))
    payload = bundle.as_dict()

    assert set(payload) == {"flow", "packet", "behavior", "dns"}
    assert payload["flow"]["flow_count"] == 5
    assert payload["behavior"]["scan_score"] > 0


def test_feature_api_extracts_from_csv(tmp_path) -> None:
    pytest.importorskip("fastapi")
    from fastapi.testclient import TestClient

    from backend.app.main import app

    sample_csv = tmp_path / "flows.csv"
    sample_csv.write_text(
        "\n".join(
            [
                "timestamp,src_ip,dst_ip,src_port,dst_port,protocol,total packets,total bytes,label",
                "2026-01-01T00:00:00Z,10.0.0.1,10.0.0.2,1234,80,TCP,5,500,BENIGN",
                "2026-01-01T00:00:02Z,10.0.0.1,10.0.0.3,1235,443,TCP,7,900,BENIGN",
            ]
        ),
        encoding="utf-8",
    )

    response = TestClient(app).post(
        "/api/features/extract",
        json={"path": str(sample_csv), "dataset": "Generic CSV", "window_seconds": 10},
    )

    assert response.status_code == 200
    assert response.json()["features"]["flow"]["flow_count"] == 2


def test_state_builder_uses_behavior_scores() -> None:
    states = build_canonical_states(
        _records(),
        window_seconds=10,
        dataset="Synthetic",
        scenario="phase3",
        capture_id="unit",
        split="demo",
    )

    assert len(states) == 1
    assert states[0].scan_score > 0
    assert states[0].exfiltration_score > 0
