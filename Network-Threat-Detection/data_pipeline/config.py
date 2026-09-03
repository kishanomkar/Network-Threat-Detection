"""Loading of the shared, editable Person 1 pipeline configuration."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG_PATH = PROJECT_ROOT / "configs" / "pipeline_config.json"


def load_pipeline_config(path: str | Path | None = None) -> dict[str, Any]:
    """Load and minimally validate the pipeline configuration."""
    config_path = Path(path) if path else DEFAULT_CONFIG_PATH
    try:
        config = json.loads(config_path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise FileNotFoundError(f"Pipeline configuration was not found: {config_path}") from exc
    except json.JSONDecodeError as exc:
        raise ValueError(f"Pipeline configuration is not valid JSON: {config_path}") from exc

    if config.get("default_window_seconds", 0) < 1:
        raise ValueError("default_window_seconds must be at least 1")
    if not isinstance(config.get("column_aliases"), dict):
        raise ValueError("column_aliases must be an object")
    ratios = config.get("chronological_split_ratios")
    if ratios is not None and not isinstance(ratios, dict):
        raise ValueError("chronological_split_ratios must be an object when provided")
    if not isinstance(config.get("duration_units", {}), dict):
        raise ValueError("duration_units must be an object when provided")
    return config
