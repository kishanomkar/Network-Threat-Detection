"""Inference service for the trained LSTM world model."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import math

from backend.app.explainability import generate_evidence
from backend.app.models import load_lstm_checkpoint
from backend.app.risk import calculate_state_risk
from backend.app.schemas import AttackStage, ForecastStep, ModelOutput, NetworkState
from backend.training.create_sequences import infer_attack_stage

try:
    import torch
except ModuleNotFoundError:  # pragma: no cover
    torch = None


class LstmForecastService:
    def __init__(self, checkpoint_path: str | Path) -> None:
        self.checkpoint_path = Path(checkpoint_path)
        self._model: Any | None = None
        self._checkpoint: dict[str, Any] | None = None
        self._load_error: str | None = None

    @property
    def is_available(self) -> bool:
        return self.checkpoint_path.exists()

    @property
    def status(self) -> dict[str, Any]:
        return {
            "name": "lstm_world_model",
            "artifact_path": str(self.checkpoint_path),
            "available": self.is_available,
            "loaded": self._model is not None,
            "load_error": self._load_error,
            "metrics": (self._checkpoint or {}).get("metrics", "Not evaluated yet"),
        }

    def forecast(self, states: list[NetworkState], *, horizon: int = 5) -> ModelOutput:
        if torch is None:
            raise RuntimeError("PyTorch is required for LSTM inference")
        if not states:
            raise ValueError("At least one NetworkState is required")
        if self._model is None:
            self._load()
        if self._model is None or self._checkpoint is None:
            raise RuntimeError(f"LSTM model is not ready: {self._load_error}")

        latest = states[-1]
        feature_matrix = [state.feature_vector for state in states]
        x = torch.nan_to_num(torch.tensor([feature_matrix], dtype=torch.float32))
        with torch.no_grad():
            output = self._model(x)
            attack_prob = float(torch.sigmoid(output["attack_logit"])[0].item())
            stage_index = int(torch.argmax(output["stage_logits"], dim=1)[0].item())
        if not math.isfinite(attack_prob):
            raise RuntimeError("LSTM produced a non-finite attack probability")
        stage_labels = self._checkpoint.get("stage_labels", [stage.value for stage in AttackStage])
        stage = AttackStage(stage_labels[min(stage_index, len(stage_labels) - 1)])
        current_stage = infer_attack_stage(latest)
        current_risk = calculate_state_risk(latest, current_stage)
        confidence = max(0.55, min(0.95, abs(attack_prob - 0.5) + 0.5))
        forecast_steps = [
            ForecastStep(step=step, risk=round(attack_prob, 4), stage=stage, confidence=round(confidence, 4))
            for step in range(1, horizon + 1)
        ]
        evidence, top_features = generate_evidence(states)
        return ModelOutput(
            timestamp=datetime.now(timezone.utc),
            current_risk=current_risk,
            predicted_risk=round(attack_prob, 4),
            predicted_stage=stage,
            confidence=round(confidence, 4),
            forecast=forecast_steps,
            evidence=evidence,
            top_features=top_features,
            model="lstm",
            model_version="mvp-0.1",
        )

    def _load(self) -> None:
        try:
            self._model, self._checkpoint = load_lstm_checkpoint(self.checkpoint_path)
        except Exception as exc:  # noqa: BLE001
            self._load_error = str(exc)
