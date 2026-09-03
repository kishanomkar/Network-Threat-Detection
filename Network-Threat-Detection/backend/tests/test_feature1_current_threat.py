from __future__ import annotations

import pandas as pd
import pytest

from backend.app.detection import detect_current_threat
from backend.app.state import build_canonical_states


def _scan_records() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "timestamp": pd.to_datetime(
                [f"2026-01-01T00:00:{second:02d}Z" for second in range(8)],
                utc=True,
            ),
            "src_ip": ["10.0.0.5"] * 8,
            "dst_ip": [f"10.0.1.{index}" for index in range(8)],
            "src_port": [40000 + index for index in range(8)],
            "dst_port": [20 + index for index in range(8)],
            "protocol": ["TCP"] * 8,
            "packet_count": [40] * 8,
            "byte_count": [2000] * 8,
            "flow_duration_ms": [100] * 8,
            "syn_count": [35] * 8,
            "ack_count": [2] * 8,
            "fin_count": [0] * 8,
            "rst_count": [0] * 8,
            "psh_count": [0] * 8,
            "urg_count": [0] * 8,
            "iat_mean_ms": [1000] * 8,
            "iat_std_ms": [5] * 8,
            "iat_max_ms": [1000] * 8,
            "ttl": [64] * 8,
            "tcp_window_size": [1024] * 8,
            "retransmission_count": [0] * 8,
            "fragment_count": [0] * 8,
            "label": ["Port Scan"] * 8,
        }
    )


def test_detect_current_threat_returns_current_status() -> None:
    states = build_canonical_states(
        _scan_records(),
        window_seconds=10,
        dataset="Synthetic",
        scenario="feature-1",
        capture_id="unit",
        split="demo",
    )

    result = detect_current_threat(states)

    assert result["status"] == "success"
    assert result["current_status"] in {"SUSPICIOUS", "ATTACK"}
    assert result["current_attack"] == "Reconnaissance"
    assert result["current_risk"] > 0
    assert result["evidence"]
    assert result["latest_state"]["scan_score"] > 0


def test_current_threat_endpoint_extracts_current_detection(tmp_path) -> None:
    pytest.importorskip("fastapi")
    from fastapi.testclient import TestClient

    from backend.app.main import app

    sample_csv = tmp_path / "scan.csv"
    _scan_records().to_csv(sample_csv, index=False)

    response = TestClient(app).post(
        "/api/threats/current",
        json={"path": str(sample_csv), "dataset": "Generic CSV", "window_seconds": 10},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert payload["current_attack"] == "Reconnaissance"
    assert payload["state_count"] == 1
