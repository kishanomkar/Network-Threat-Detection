from __future__ import annotations

import pytest


def test_investigation_case_endpoint_with_demo_pcap() -> None:
    pytest.importorskip("fastapi")
    from fastapi.testclient import TestClient

    from backend.app.main import app

    response = TestClient(app).post(
        "/api/investigate/case",
        json={
            "path": "data/raw/ctu13/ctu13_scenario1_neris_botnet.pcap",
            "dataset": "PCAP",
            "max_records": 1000,
            "sequence_length": 5,
            "horizon": 5,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert payload["case_id"]
    assert payload["recommended_actions"]
    assert "suspect_hosts" in payload
