"""Lightweight LSTM world model for SIH MVP forecasting."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

try:
    import torch
    import torch.nn as nn
except ModuleNotFoundError:  # pragma: no cover - dependency-light test env
    torch = None
    nn = None


@dataclass(frozen=True)
class LstmWorldModelConfig:
    input_dim: int
    hidden_dim: int = 64
    num_layers: int = 1
    stage_count: int = 9
    dropout: float = 0.0


if nn is not None:

    class LstmWorldModel(nn.Module):
        """Multi-task temporal model: next state, attack probability, stage."""

        def __init__(self, config: LstmWorldModelConfig) -> None:
            super().__init__()
            self.config = config
            self.encoder = nn.LSTM(
                input_size=config.input_dim,
                hidden_size=config.hidden_dim,
                num_layers=config.num_layers,
                batch_first=True,
                dropout=config.dropout if config.num_layers > 1 else 0.0,
            )
            self.next_state_head = nn.Linear(config.hidden_dim, config.input_dim)
            self.attack_head = nn.Linear(config.hidden_dim, 1)
            self.stage_head = nn.Linear(config.hidden_dim, config.stage_count)

        def forward(self, x: Any) -> dict[str, Any]:
            _, (hidden, _) = self.encoder(x)
            latent = hidden[-1]
            return {
                "next_state": self.next_state_head(latent),
                "attack_logit": self.attack_head(latent).squeeze(-1),
                "stage_logits": self.stage_head(latent),
            }


else:

    class LstmWorldModel:  # type: ignore[no-redef]
        def __init__(self, *_: Any, **__: Any) -> None:
            raise ModuleNotFoundError("PyTorch is required for LstmWorldModel")


def save_lstm_checkpoint(
    path: str | Path,
    model: Any,
    *,
    config: LstmWorldModelConfig,
    stage_labels: list[str],
    metrics: dict[str, float] | None = None,
) -> Path:
    if torch is None:
        raise ModuleNotFoundError("PyTorch is required to save LSTM checkpoints")
    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(
        {
            "state_dict": model.state_dict(),
            "config": config.__dict__,
            "stage_labels": stage_labels,
            "metrics": metrics or {},
        },
        output_path,
    )
    return output_path


def load_lstm_checkpoint(path: str | Path, map_location: str = "cpu") -> tuple[Any, dict[str, Any]]:
    if torch is None:
        raise ModuleNotFoundError("PyTorch is required to load LSTM checkpoints")
    checkpoint = torch.load(Path(path), map_location=map_location)
    config = LstmWorldModelConfig(**checkpoint["config"])
    model = LstmWorldModel(config)
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    return model, checkpoint

