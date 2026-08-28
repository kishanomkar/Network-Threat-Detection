"""Local model registry with explicit metadata for offline inference."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib

from .antcm_features import load_antcm_feature_schema
from .antcm_compat import load_antcm_model


@dataclass(frozen=True)
class RegistryEntry:
    name: str
    artifact_path: Path
    version: str
    training_dataset: str
    feature_count: int | None
    sequence_length: int | None
    metrics: dict[str, float] | None
    notes: str


class ModelRegistry:
    """Discover and load local model artifacts without cloud dependencies."""

    def __init__(self, root: str | Path) -> None:
        self.root = Path(root)
        antcm_schema = load_antcm_feature_schema(self.root)
        self.entries = {
            "antcm": RegistryEntry(
                name="antcm",
                artifact_path=self.root / "ANTCM_trained_model.pkl",
                version="0.1.0",
                training_dataset=antcm_schema["training_dataset"],
                feature_count=int(antcm_schema["total_feature_count"]),
                sequence_length=None,
                metrics=antcm_schema["reported_metrics"],
                notes="Pretrained static ANTCM classifier; useful as a high-accuracy baseline, not the final temporal World Model.",
            )
        }

    def list_models(self) -> list[dict[str, Any]]:
        return [
            {
                "name": entry.name,
                "artifact_path": str(entry.artifact_path),
                "available": entry.artifact_path.exists(),
                "version": entry.version,
                "training_dataset": entry.training_dataset,
                "feature_count": entry.feature_count,
                "sequence_length": entry.sequence_length,
                "metrics": entry.metrics or "Not evaluated yet",
                "notes": entry.notes,
            }
            for entry in self.entries.values()
        ]

    def load(self, name: str) -> Any:
        entry = self.entries[name]
        if not entry.artifact_path.exists():
            raise FileNotFoundError(f"Model artifact not found: {entry.artifact_path}")
        if name == "antcm":
            return load_antcm_model(entry.artifact_path)
        return joblib.load(entry.artifact_path)
