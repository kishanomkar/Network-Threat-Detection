"""Guarded inference service for the pretrained ANTCM artifact."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np

from backend.app.models import ModelRegistry
from backend.app.models.antcm_features import load_antcm_feature_schema, network_state_to_antcm_features
from backend.app.schemas import AttackStage, ForecastStep, ModelOutput, NetworkState


class AntcmForecastService:
    """Use ANTCM only when its runtime and input schema are available."""

    def __init__(self, project_root: str | Path) -> None:
        self.registry = ModelRegistry(project_root)
        self.project_root = Path(project_root)
        self.feature_schema = load_antcm_feature_schema(project_root)
        self._model: Any | None = None
        self._load_error: str | None = None

    @property
    def status(self) -> dict[str, Any]:
        entry = self.registry.list_models()[0]
        return {
            **entry,
            "loaded": self._model is not None,
            "load_error": self._load_error,
            "expected_feature_count": getattr(self._model, "expected_feature_count", None),
        }

    def _try_load(self) -> None:
        try:
            self._model = self.registry.load("antcm")
        except Exception as exc:  # noqa: BLE001 - report exact runtime readiness to API clients.
            self._load_error = str(exc)

    def forecast(self, states: list[NetworkState], horizon: int = 5) -> ModelOutput:
        if not states:
            raise ValueError("At least one NetworkState is required")
        if self._model is None:
            self._try_load()
        if self._model is None:
            raise RuntimeError(f"ANTCM model is not ready: {self._load_error}")

        latest = states[-1]
        feature_matrix = np.asarray([network_state_to_antcm_features(latest, self.feature_schema)], dtype=float)
        prediction = self._model.predict(feature_matrix)[0]
        probabilities = self._model.predict_proba(feature_matrix)
        confidence = float(np.max(probabilities[0])) if probabilities is not None else 0.0
        stage = self._stage_from_prediction(prediction)
        risk = self._risk_from_stage(stage, confidence)

        return ModelOutput(
            timestamp=datetime.now(timezone.utc),
            current_risk=risk,
            predicted_risk=risk,
            predicted_stage=stage,
            confidence=confidence,
            forecast=[
                ForecastStep(step=step, risk=risk, stage=stage, confidence=confidence)
                for step in range(1, horizon + 1)
            ],
            evidence=["ANTCM pretrained classifier evaluated the latest canonical state vector."],
            top_features=[],
            model="antcm",
            model_version="0.1.0",
        )

    @staticmethod
    def _stage_from_prediction(prediction: Any) -> AttackStage:
        text = str(prediction).lower()
        if any(token in text for token in ("benign", "normal")):
            return AttackStage.BENIGN
        if any(token in text for token in ("scan", "recon", "infiltration")):
            return AttackStage.RECONNAISSANCE
        if "bot" in text or "c2" in text:
            return AttackStage.COMMAND_AND_CONTROL
        if "dos" in text or "ddos" in text:
            return AttackStage.EXECUTION
        return AttackStage.INITIAL_ACCESS

    @staticmethod
    def _risk_from_stage(stage: AttackStage, confidence: float) -> float:
        severity = {
            AttackStage.BENIGN: 0.05,
            AttackStage.RECONNAISSANCE: 0.35,
            AttackStage.INITIAL_ACCESS: 0.55,
            AttackStage.EXECUTION: 0.65,
            AttackStage.PERSISTENCE: 0.65,
            AttackStage.PRIVILEGE_ESCALATION: 0.75,
            AttackStage.LATERAL_MOVEMENT: 0.80,
            AttackStage.COMMAND_AND_CONTROL: 0.85,
            AttackStage.EXFILTRATION: 0.90,
        }[stage]
        return round(min(1.0, severity * max(confidence, 0.5)), 4)
