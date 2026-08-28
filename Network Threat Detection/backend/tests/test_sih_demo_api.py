from __future__ import annotations

import pytest


def test_root_health_and_project_overview_contracts() -> None:
    pytest.importorskip("fastapi")
    from fastapi.testclient import TestClient

    from backend.app.main import app

    client = TestClient(app)

    root = client.get("/")
    health = client.get("/health")
    overview = client.get("/api/project/overview")

    assert root.status_code == 200
    assert "/api/analyze" in root.json()["available_endpoints"]
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"
    assert isinstance(health.json()["loaded_models"], list)
    assert overview.status_code == 200
    assert overview.json()["person_role"].startswith("Person 2")
    assert len(overview.json()["pipeline"]) >= 4


def test_file_loading_routes_return_clear_bad_path_errors() -> None:
    pytest.importorskip("fastapi")
    from fastapi.testclient import TestClient

    from backend.app.main import app

    client = TestClient(app)
    requests = [
        ("/api/features/extract", {"path": "missing.csv", "dataset": "Generic CSV"}),
        ("/api/sequences/create", {"path": "missing.csv", "dataset": "Generic CSV"}),
        ("/api/analyze", {"path": "missing.csv", "dataset": "Generic CSV"}),
    ]

    for route, payload in requests:
        response = client.post(route, json=payload)
        assert response.status_code == 400
        assert "Input file not found" in response.json()["detail"]
