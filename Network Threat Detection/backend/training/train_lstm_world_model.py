"""Train the lightweight LSTM world model from sequence JSONL examples."""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np

from backend.app.models import LstmWorldModelConfig, save_lstm_checkpoint
from backend.training.create_sequences import examples_to_numpy, load_sequence_examples

try:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader, TensorDataset

    from backend.app.models import LstmWorldModel
except ModuleNotFoundError:  # pragma: no cover - dependency-light env
    torch = None
    nn = None
    DataLoader = None
    TensorDataset = None
    LstmWorldModel = None


@dataclass(frozen=True)
class TrainingConfig:
    epochs: int = 20
    batch_size: int = 32
    learning_rate: float = 0.001
    alpha_state: float = 1.0
    beta_attack: float = 1.0
    gamma_stage: float = 1.0
    seed: int = 42


def train_lstm_from_examples(
    examples_path: str | Path,
    output_path: str | Path,
    *,
    config: TrainingConfig | None = None,
) -> dict[str, Any]:
    if torch is None or nn is None or DataLoader is None or TensorDataset is None or LstmWorldModel is None:
        raise ModuleNotFoundError("PyTorch is required to train the LSTM world model")
    training_config = config or TrainingConfig()
    torch.manual_seed(training_config.seed)
    np.random.seed(training_config.seed)

    examples = load_sequence_examples(examples_path)
    arrays = examples_to_numpy(examples)
    x_values = _standardize(np.asarray(arrays["x"], dtype=float))
    y_next_values = _standardize(np.asarray(arrays["y_next_state"], dtype=float))
    x = torch.tensor(x_values, dtype=torch.float32)
    y_next = torch.tensor(y_next_values, dtype=torch.float32)
    y_attack = torch.tensor(arrays["y_attack"], dtype=torch.float32)
    y_stage = torch.tensor(arrays["y_stage"], dtype=torch.long)

    dataset = TensorDataset(x, y_next, y_attack, y_stage)
    loader = DataLoader(dataset, batch_size=training_config.batch_size, shuffle=True)
    model_config = LstmWorldModelConfig(input_dim=x.shape[-1], stage_count=len(arrays["stage_labels"]))
    model = LstmWorldModel(model_config)
    optimizer = torch.optim.Adam(model.parameters(), lr=training_config.learning_rate)
    state_loss_fn = nn.MSELoss()
    attack_loss_fn = nn.BCEWithLogitsLoss()
    stage_loss_fn = nn.CrossEntropyLoss()

    last_loss = 0.0
    for _ in range(training_config.epochs):
        batch_losses: list[float] = []
        for batch_x, batch_next, batch_attack, batch_stage in loader:
            optimizer.zero_grad()
            output = model(batch_x)
            loss = (
                training_config.alpha_state * state_loss_fn(output["next_state"], batch_next)
                + training_config.beta_attack * attack_loss_fn(output["attack_logit"], batch_attack)
                + training_config.gamma_stage * stage_loss_fn(output["stage_logits"], batch_stage)
            )
            loss.backward()
            optimizer.step()
            batch_losses.append(float(loss.item()))
        last_loss = float(np.mean(batch_losses)) if batch_losses else 0.0

    metrics = evaluate_lstm_model(model, x, y_attack, y_stage)
    metrics["train_loss"] = round(last_loss, 6)
    checkpoint_path = save_lstm_checkpoint(
        output_path,
        model,
        config=model_config,
        stage_labels=list(arrays["stage_labels"]),
        metrics=metrics,
    )
    return {
        "output": str(checkpoint_path),
        "example_count": len(examples),
        "sequence_length": int(x.shape[1]),
        "feature_count": int(x.shape[2]),
        "metrics": metrics,
    }


def evaluate_lstm_model(model: Any, x: Any, y_attack: Any, y_stage: Any) -> dict[str, float]:
    if torch is None:
        raise ModuleNotFoundError("PyTorch is required to evaluate the LSTM world model")
    with torch.no_grad():
        output = model(x)
        attack_prob = torch.sigmoid(output["attack_logit"])
        attack_pred = (attack_prob >= 0.5).float()
        stage_pred = torch.argmax(output["stage_logits"], dim=1)
        attack_actual = (y_attack >= 0.5).float()
        attack_accuracy = float((attack_pred == attack_actual).float().mean().item())
        stage_accuracy = float((stage_pred == y_stage).float().mean().item())
        mean_attack_probability = float(attack_prob.mean().item())
    return {
        "attack_accuracy": round(attack_accuracy, 4),
        "stage_accuracy": round(stage_accuracy, 4),
        "mean_attack_probability": round(mean_attack_probability, 4),
    }


def _standardize(values: np.ndarray) -> np.ndarray:
    finite = np.nan_to_num(values.astype(float))
    mean = finite.mean(axis=tuple(range(finite.ndim - 1)), keepdims=True)
    std = finite.std(axis=tuple(range(finite.ndim - 1)), keepdims=True)
    return np.nan_to_num((finite - mean) / np.where(std == 0, 1.0, std))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Train LSTM world model from sequence JSONL")
    parser.add_argument("--sequences", required=True, help="Input sequence JSONL path")
    parser.add_argument("--output", default="models/lstm_world_model.pt", help="Output checkpoint path")
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--learning-rate", type=float, default=0.001)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    result = train_lstm_from_examples(
        args.sequences,
        args.output,
        config=TrainingConfig(
            epochs=args.epochs,
            batch_size=args.batch_size,
            learning_rate=args.learning_rate,
        ),
    )
    print(json.dumps(result, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
