from __future__ import annotations

import pandas as pd
import pytest


def _graph_records() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "timestamp": pd.to_datetime(
                [f"2026-01-01T00:0{minute}:00Z" for minute in range(6)],
                utc=True,
            ),
            "src_ip": ["10.0.0.10", "10.0.0.10", "10.0.0.11", "10.0.0.11", "10.0.0.12", "10.0.0.12"],
            "dst_ip": ["10.0.4.1", "10.0.4.2", "10.0.4.2", "10.0.4.3", "10.0.4.3", "10.0.4.4"],
            "src_port": [44000, 44001, 44002, 44003, 44004, 44005],
            "dst_port": [80, 443, 22, 8080, 53, 25],
            "protocol": ["TCP", "TCP", "TCP", "TCP", "UDP", "TCP"],
            "packet_count": [15, 18, 22, 30, 10, 26],
            "byte_count": [1500, 1800, 2200, 3000, 1000, 2600],
            "flow_duration_ms": [100] * 6,
            "syn_count": [4, 5, 8, 12, 0, 10],
            "ack_count": [2] * 6,
            "fin_count": [0] * 6,
            "rst_count": [0] * 6,
            "psh_count": [0] * 6,
            "urg_count": [0] * 6,
            "iat_mean_ms": [1000] * 6,
            "iat_std_ms": [5] * 6,
            "iat_max_ms": [1000] * 6,
            "ttl": [64] * 6,
            "tcp_window_size": [1024] * 6,
            "retransmission_count": [0] * 6,
            "fragment_count": [0] * 6,
            "label": ["Benign"] * 6,
        }
    )


def test_network_graph_endpoint_returns_nodes_and_links(tmp_path) -> None:
    pytest.importorskip("fastapi")
    from fastapi.testclient import TestClient

    from backend.app.main import app

    sample_csv = tmp_path / "graph.csv"
    _graph_records().to_csv(sample_csv, index=False)

    response = TestClient(app).post(
        "/api/graph/network",
        json={"path": str(sample_csv), "dataset": "Generic CSV", "window_seconds": 10, "graph_limit": 3},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert payload["summary"]["node_count"] > 0
    assert payload["summary"]["edge_count"] > 0
    assert payload["graph"]["nodes"]
    assert payload["graph"]["links"]
    assert payload["graph_count"] <= 3
