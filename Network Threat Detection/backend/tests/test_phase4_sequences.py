from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from backend.app.schemas import AttackStage, NetworkState, StateSource
from backend.training.create_sequences import (
    create_sequence_examples,
    examples_to_numpy,
    infer_attack_stage,
    load_sequence_examples,
    save_sequence_examples,
)


def _state(index: int, label: str = "Benign", scan_score: float = 0.0) -> NetworkState:
    timestamp = datetime(2026, 1, 1, tzinfo=timezone.utc) + timedelta(seconds=index * 10)
    return NetworkState(
        state_id=f"state-{index}",
        timestamp=timestamp,
        window_start=timestamp,
        window_end=timestamp + timedelta(seconds=10),
        window_seconds=10,
        source=StateSource(dataset="Synthetic", scenario="phase4", capture_id="unit", split="demo"),
        flow_count=10,
        packet_count=100,
        unique_sources=1,
        unique_destinations=5,
        unique_ports=5,
        bytes_total=1000,
        packets_total=100,
        syn_rate=0.1,
        ack_rate=0.1,
        rst_rate=0.0,
        mean_iat=100,
        iat_std=10,
        port_fanout=5,
        host_fanout=5,
        scan_score=scan_score,
        beacon_score=0.0,
        exfiltration_score=0.0,
        ttl_mean=64,
        ttl_std=0,
        packet_size_mean=100,
        packet_size_std=0,
        outbound_bytes=1000,
        inbound_bytes=0,
        protocol_distribution={"TCP": 10},
        feature_vector=[float(index), scan_score, 100.0],
        raw_state={"ground_truth": {"current_label": label}},
    )


def test_create_sequence_examples_uses_chronological_order() -> None:
    states = [_state(4), _state(0), _state(2), _state(1), _state(3, label="Bot")]
    examples = create_sequence_examples(states, sequence_length=3)

    assert len(examples) == 2
    assert [state.state_id for state in examples[0].sequence.states] == ["state-0", "state-1", "state-2"]
    assert examples[0].target.next_state.state_id == "state-3"
    assert examples[0].target.attack_stage == AttackStage.COMMAND_AND_CONTROL


def test_create_sequence_examples_respects_forecast_offset() -> None:
    states = [_state(index) for index in range(6)]
    examples = create_sequence_examples(states, sequence_length=3, forecast_offset=2)

    assert len(examples) == 2
    assert examples[0].target.next_state.state_id == "state-4"


def test_create_sequence_examples_returns_empty_for_short_series() -> None:
    assert create_sequence_examples([_state(0), _state(1)], sequence_length=3) == []


def test_sequence_examples_round_trip_jsonl(tmp_path) -> None:
    examples = create_sequence_examples([_state(index) for index in range(5)], sequence_length=3)
    output_path = save_sequence_examples(examples, tmp_path / "sequences.jsonl")
    loaded = load_sequence_examples(output_path)

    assert len(loaded) == len(examples)
    assert loaded[0].sequence.sequence_id == examples[0].sequence.sequence_id
    assert loaded[0].target.next_state.state_id == examples[0].target.next_state.state_id


def test_sequence_examples_export_to_numpy_shapes() -> None:
    examples = create_sequence_examples([_state(index) for index in range(5)], sequence_length=3)
    arrays = examples_to_numpy(examples)

    assert arrays["x"].shape == (2, 3, 3)
    assert arrays["y_next_state"].shape == (2, 3)
    assert arrays["y_attack"].shape == (2,)
    assert arrays["y_stage"].shape == (2,)
    assert "Reconnaissance" in arrays["stage_labels"]


def test_infer_attack_stage_uses_behavior_when_label_missing() -> None:
    state = _state(0, label="", scan_score=0.8)
    state.raw_state = {}

    assert infer_attack_stage(state) == AttackStage.RECONNAISSANCE


def test_sequence_api_creates_examples_from_csv(tmp_path) -> None:
    pytest.importorskip("fastapi")
    from fastapi.testclient import TestClient

    from backend.app.main import app

    rows = ["timestamp,src_ip,dst_ip,src_port,dst_port,protocol,total packets,total bytes,label"]
    for index in range(5):
        rows.append(
            f"2026-01-01T00:00:{index * 10:02d}Z,10.0.0.1,10.0.0.{index + 2},1234,80,TCP,5,500,BENIGN"
        )
    sample_csv = tmp_path / "flows.csv"
    sample_csv.write_text("\n".join(rows), encoding="utf-8")
    output_path = tmp_path / "api_sequences.jsonl"

    response = TestClient(app).post(
        "/api/sequences/create",
        json={
            "path": str(sample_csv),
            "dataset": "Generic CSV",
            "window_seconds": 10,
            "sequence_length": 3,
            "output_path": str(output_path),
        },
    )

    assert response.status_code == 200
    assert response.json()["sequence_count"] == 2
    assert output_path.exists()
