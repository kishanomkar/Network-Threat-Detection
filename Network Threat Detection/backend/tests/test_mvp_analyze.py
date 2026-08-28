from __future__ import annotations

import pytest


def test_analyze_endpoint_returns_mvp_forecast(tmp_path) -> None:
    pytest.importorskip("fastapi")
    from fastapi.testclient import TestClient

    from backend.app.main import app

    rows = ["timestamp,src_ip,dst_ip,src_port,dst_port,protocol,total packets,total bytes,syn count,ack count,label"]
    for index in range(8):
        dst_port = 20 + index
        label = "Benign" if index < 5 else "Port Scan"
        rows.append(
            f"2026-01-01T00:00:{index * 10:02d}Z,10.0.0.5,10.0.1.{index},40000,{dst_port},TCP,40,2000,30,2,{label}"
        )
    sample_csv = tmp_path / "progression.csv"
    sample_csv.write_text("\n".join(rows), encoding="utf-8")

    response = TestClient(app).post(
        "/api/analyze",
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
    assert payload["state_count"] == 8
    assert payload["sequence_count"] > 0
    assert payload["future_risk"] >= payload["current_risk"]
    assert len(payload["timeline"]) == 4
    assert payload["explanations"]
    assert payload["model"] == "temporal-fallback"
