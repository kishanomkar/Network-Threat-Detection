from __future__ import annotations

import pytest

from backend.tests.test_phase4_sequences import _state
from backend.training.create_sequences import create_sequence_examples, save_sequence_examples


def test_lstm_world_model_forward_shape() -> None:
    torch = pytest.importorskip("torch")
    from backend.app.models import LstmWorldModel, LstmWorldModelConfig

    model = LstmWorldModel(LstmWorldModelConfig(input_dim=3, hidden_dim=8, stage_count=9))
    output = model(torch.zeros((2, 4, 3), dtype=torch.float32))

    assert output["next_state"].shape == (2, 3)
    assert output["attack_logit"].shape == (2,)
    assert output["stage_logits"].shape == (2, 9)


def test_lstm_training_saves_checkpoint(tmp_path) -> None:
    pytest.importorskip("torch")
    from backend.training.train_lstm_world_model import TrainingConfig, train_lstm_from_examples

    examples = create_sequence_examples([_state(index, label="Benign") for index in range(8)], sequence_length=3)
    sequence_path = save_sequence_examples(examples, tmp_path / "sequences.jsonl")
    output_path = tmp_path / "lstm_world_model.pt"

    result = train_lstm_from_examples(
        sequence_path,
        output_path,
        config=TrainingConfig(epochs=1, batch_size=2, learning_rate=0.001),
    )

    assert output_path.exists()
    assert result["example_count"] == len(examples)
    assert result["feature_count"] == 3
    assert "attack_accuracy" in result["metrics"]
