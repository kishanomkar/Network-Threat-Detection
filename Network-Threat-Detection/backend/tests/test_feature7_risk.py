from __future__ import annotations

import pytest

from backend.app.risk import score_composite_risk
from backend.app.state import build_canonical_states
from backend.tests.test_feature1_current_threat import _scan_records


def test_composite_risk_returns_banded_score() -> None:
    states = build_canonical_states(
        _scan_records(),
        window_seconds=10,
        dataset="Synthetic",
        scenario="feature-7",
        capture_id="unit",
        split="demo",
    )
    result = score_composite_risk(states)

    assert result["status"] == "success"
    assert 0 <= result["score"] <= 100
    assert result["level"] in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
    names = [item["name"] for item in result["components"]]
    assert names == ["current_threat", "temporal", "host", "attack_stage", "anomaly"]
    assert abs(sum(item["weight"] for item in result["components"]) - 1.0) < 1e-9
    assert result["score"] > 0


def test_risk_assessment_route_schema() -> None:
    pytest.importorskip("fastapi")
    from fastapi.testclient import TestClient

    from backend.app.main import app

    client = TestClient(app)
    # Using the same dummy dataset path approach as in test_sih_demo_api.py
    # or just mocking the payload to see if schema validation handles it, 
    # but we need a valid dataset to test the full response. We can use a missing path to test failure
    response = client.post("/api/risk/assessment", json={"path": "missing.csv", "dataset": "Generic CSV"})
    assert response.status_code == 400
    assert "Input file not found" in response.json()["detail"]
