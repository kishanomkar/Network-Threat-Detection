from __future__ import annotations

import pandas as pd
import pytest


def _progression_records() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "timestamp": pd.to_datetime(
                [f"2026-01-01T00:0{minute}:00Z" for minute in range(8)],
                utc=True,
            ),
            "src_ip": ["10.0.0.8"] * 8,
            "dst_ip": [f"10.0.2.{index}" for index in range(8)],
            "src_port": [42000 + index for index in range(8)],
            "dst_port": [20 + index for index in range(8)],
            "protocol": ["TCP"] * 8,
            "packet_count": [20, 25, 30, 35, 45, 55, 70, 90],
            "byte_count": [1000, 1200, 1500, 2000, 2600, 3500, 4500, 6000],
            "flow_duration_ms": [100] * 8,
            "syn_count": [10, 12, 15, 20, 30, 40, 55, 75],
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
            "label": ["Benign", "Benign", "Benign", "Scan", "Scan", "Scan", "Scan", "Scan"],
        }
    )


def test_forecast_file_endpoint_returns_future_risk_timeline(tmp_path) -> None:
    pytest.importorskip("fastapi")
    from fastapi.testclient import TestClient

    from backend.app.main import app

    sample_csv = tmp_path / "progression.csv"
    _progression_records().to_csv(sample_csv, index=False)

    response = TestClient(app).post(
        "/api/forecast/file",
        json={
            "path": str(sample_csv),
            "dataset": "Generic CSV",
            "window_seconds": 10,
            "sequence_length": 5,
            "horizon": 4,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert payload["future_risk"] >= payload["current_risk"]
    assert payload["predicted_stage"]
    assert len(payload["timeline"]) == 4
    assert payload["model"] in {"temporal-fallback", "lstm"}
