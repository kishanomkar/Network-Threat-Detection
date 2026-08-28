from __future__ import annotations

import json
from pathlib import Path
import os

import pytest

from backend.app.models import ModelRegistry
from backend.app.models.antcm_features import load_antcm_feature_schema, network_state_to_antcm_features
from backend.app.schemas import DatasetKind
from backend.app.state import legacy_state_to_canonical
from backend.data_adapters import get_adapter


PROJECT_ROOT = Path(__file__).resolve().parents[2]


def test_generic_csv_adapter_loads_flow_records(tmp_path: Path) -> None:
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
    adapter = get_adapter(DatasetKind.GENERIC_CSV)
    result = adapter.load(sample_csv)

    assert result.source_kind == "flow_csv"
    assert not result.records.empty
    assert {"timestamp", "src_ip", "dst_ip", "packet_count", "byte_count"}.issubset(result.records.columns)


def test_canonical_states_have_stable_feature_vectors() -> None:
    state_path = (
        PROJECT_ROOT
        / "network_states"
        / "ctu13_scenario1"
        / "ctu13_scenario1_neris_botnet.network_states.jsonl"
    )
    first_state = json.loads(state_path.read_text(encoding="utf-8").splitlines()[0])
    state = legacy_state_to_canonical(first_state)

    assert state.feature_vector
    assert state.window_end > state.window_start
    assert state.source.dataset == DatasetKind.CTU_13


def test_model_registry_reports_antcm_availability() -> None:
    registry = ModelRegistry(PROJECT_ROOT)
    antcm = next(model for model in registry.list_models() if model["name"] == "antcm")

    assert antcm["available"] is True
    assert antcm["feature_count"] == 84
    assert antcm["metrics"]["accuracy"] == 0.9752


def test_network_state_maps_to_antcm_feature_schema() -> None:
    state_path = (
        PROJECT_ROOT
        / "network_states"
        / "ctu13_scenario1"
        / "ctu13_scenario1_neris_botnet.network_states.jsonl"
    )
    first_state = json.loads(state_path.read_text(encoding="utf-8").splitlines()[0])
    state = legacy_state_to_canonical(first_state)
    schema = load_antcm_feature_schema(PROJECT_ROOT)
    features = network_state_to_antcm_features(state, schema)

    assert len(features) == 84
    assert features[0] in {0.0, 1.0, 6.0, 17.0}


def test_antcm_loader_reports_feature_shape_when_dependencies_exist() -> None:
    if os.environ.get("RUN_ANTCM_LOAD_TEST") != "1":
        pytest.skip("Full ANTCM pickle loading is opt-in because the artifact is large and notebook-trained")
    pytest.importorskip("torch")
    registry = ModelRegistry(PROJECT_ROOT)
    model = registry.load("antcm")

    assert model.expected_feature_count is not None
    assert model.expected_feature_count > 0


def test_antcm_status_api_reports_runtime_readiness() -> None:
    pytest.importorskip("fastapi")
    from fastapi.testclient import TestClient

    from backend.app.main import app

    response = TestClient(app).get("/api/models/antcm/status")

    assert response.status_code == 200
    payload = response.json()
    assert payload["name"] == "antcm"
    assert payload["available"] is True
    assert "loaded" in payload
