"""Real feature attributions for current risk. Never invent SHAP values."""

from __future__ import annotations

from typing import Any

import numpy as np

from backend.app.risk import calculate_state_risk
from backend.app.schemas import NetworkState
from backend.training.create_sequences import infer_attack_stage

EXPLAIN_FEATURES: tuple[tuple[str, str], ...] = (
    ("syn_rate", "SYN Rate"),
    ("host_fanout", "Host Fan-out"),
    ("port_fanout", "Unique Ports"),
    ("packet_count", "Packet Rate"),
    ("iat_std", "IAT Variance"),
    ("scan_score", "Scan Score"),
    ("beacon_score", "Beacon Score"),
    ("exfiltration_score", "Exfiltration Score"),
    ("bytes_total", "Byte Volume"),
    ("rst_rate", "RST Rate"),
)
FEATURE_KEYS = [key for key, _ in EXPLAIN_FEATURES]


def explain_current_threat(states: list[NetworkState]) -> dict[str, Any]:
    if not states:
        return {"status": "NO_DATA", "message": "No network states available to explain"}

    latest = states[-1]
    stage = infer_attack_stage(latest)
    risk = calculate_state_risk(latest, stage)
    instance = _vector(latest)
    baseline = np.mean([_vector(state) for state in states[:-1]], axis=0) if len(states) > 1 else np.zeros_like(instance)
    method, raw = _shap_or_ablation(latest, instance, baseline)
    contributions = _to_contributions(raw)
    return {
        "status": "success",
        "method": method,
        "target": "current_risk",
        "predicted_stage": stage.value,
        "current_risk": int(round(risk * 100)),
        "contributions": contributions,
        "top_features": [item["feature"] for item in contributions[:5]],
        "caveat": "Attributions explain the live risk scorer on this traffic window. They are not copied from notebook accuracy numbers.",
    }


def _vector(state: NetworkState) -> np.ndarray:
    return np.asarray([float(getattr(state, key)) for key in FEATURE_KEYS], dtype=float)


def _score_state(state: NetworkState) -> float:
    return float(calculate_state_risk(state, infer_attack_stage(state)) * 100.0)


def _overlay(template: NetworkState, row: np.ndarray) -> NetworkState:
    updates: dict[str, Any] = {}
    for key, value in zip(FEATURE_KEYS, row, strict=True):
        current = getattr(template, key)
        updates[key] = int(round(value)) if isinstance(current, int) else float(value)
    return template.model_copy(update=updates)


def _shap_or_ablation(template: NetworkState, instance: np.ndarray, baseline: np.ndarray) -> tuple[str, np.ndarray]:
    return "shapley_permutation", _sampled_shapley(template, instance, baseline)


def _sampled_shapley(
    template: NetworkState,
    instance: np.ndarray,
    baseline: np.ndarray,
    samples: int = 24,
) -> np.ndarray:
    """Monte Carlo Shapley values over feature permutations of the live risk scorer."""
    rng = np.random.default_rng(42)
    n = len(FEATURE_KEYS)
    values = np.zeros(n, dtype=float)
    for _ in range(samples):
        current = baseline.copy()
        previous = _score_state(_overlay(template, current))
        for index in rng.permutation(n):
            current[index] = instance[index]
            next_score = _score_state(_overlay(template, current))
            values[index] += next_score - previous
            previous = next_score
    return values / samples


def _to_contributions(raw: np.ndarray) -> list[dict[str, Any]]:
    total = float(np.sum(np.abs(raw))) or 1.0
    ranked = sorted(zip(EXPLAIN_FEATURES, raw, strict=True), key=lambda item: abs(item[1]), reverse=True)
    return [
        {
            "feature": label,
            "key": key,
            "shap_value": round(float(value), 4),
            "contribution_pct": round(float(value) / total * 100.0, 1),
        }
        for (key, label), value in ranked
        if abs(value) > 1e-9
    ]
