"""Training-only numeric preprocessing for Person 2's temporal state vectors."""

from __future__ import annotations

from collections.abc import Iterable
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler


STATE_VECTOR_PATHS = (
    "traffic_features.packet_count",
    "traffic_features.flow_count",
    "traffic_features.byte_count",
    "traffic_features.packets_per_second",
    "traffic_features.bytes_per_second",
    "traffic_features.unique_src_ips",
    "traffic_features.unique_dst_ips",
    "traffic_features.unique_src_ports",
    "traffic_features.unique_dst_ports",
    "traffic_features.port_fanout",
    "traffic_features.syn_rate",
    "traffic_features.tcp_flag_counts.syn",
    "traffic_features.tcp_flag_counts.ack",
    "traffic_features.tcp_flag_counts.fin",
    "traffic_features.tcp_flag_counts.rst",
    "traffic_features.timing.mean_iat_ms",
    "traffic_features.timing.std_iat_ms",
    "traffic_features.timing.max_iat_ms",
    "traffic_features.timing.mean_flow_duration_ms",
    "traffic_features.timing.max_flow_duration_ms",
    "traffic_features.packet_metadata.mean_packet_size",
    "traffic_features.packet_metadata.mean_ttl",
    "traffic_features.packet_metadata.ttl_std",
    "traffic_features.packet_metadata.mean_tcp_window_size",
    "traffic_features.packet_metadata.retransmission_count",
    "traffic_features.packet_metadata.fragment_count",
)


def _read_path(state: dict[str, Any], dotted_path: str) -> float:
    value: Any = state
    for part in dotted_path.split("."):
        if not isinstance(value, dict):
            return float("nan")
        value = value.get(part)
    if value is None or isinstance(value, bool):
        return float("nan")
    try:
        return float(value)
    except (TypeError, ValueError):
        return float("nan")


def states_to_matrix(states: Iterable[dict[str, Any]]) -> np.ndarray:
    rows = [[_read_path(state, path) for path in STATE_VECTOR_PATHS] for state in states]
    if not rows:
        raise ValueError("At least one network state is required")
    return np.asarray(rows, dtype=float)


class StatePreprocessor:
    """Median-impute and standardise state vectors without leaking future data.

    Call fit() only with chronological training states. Validation, test and live states
    must call transform() using that saved fitted instance.
    """

    def __init__(self) -> None:
        self.imputer = SimpleImputer(strategy="median", add_indicator=True, keep_empty_features=True)
        self.scaler = StandardScaler()
        self._is_fitted = False

    def fit(self, training_states: Iterable[dict[str, Any]]) -> "StatePreprocessor":
        matrix = states_to_matrix(training_states)
        self.scaler.fit(self.imputer.fit_transform(matrix))
        self._is_fitted = True
        return self

    def transform(self, states: Iterable[dict[str, Any]]) -> np.ndarray:
        if not self._is_fitted:
            raise RuntimeError("StatePreprocessor must be fit on training states before transform()")
        return self.scaler.transform(self.imputer.transform(states_to_matrix(states)))

    def metadata(self) -> dict[str, list[str]]:
        if not self._is_fitted:
            raise RuntimeError("StatePreprocessor must be fit before metadata()")
        return {
            "input_features": list(STATE_VECTOR_PATHS),
            "output_features": self.imputer.get_feature_names_out(STATE_VECTOR_PATHS).tolist(),
        }

    def save(self, path: str | Path) -> Path:
        if not self._is_fitted:
            raise RuntimeError("StatePreprocessor must be fit before save()")
        output_path = Path(path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, output_path)
        return output_path

    @classmethod
    def load(cls, path: str | Path) -> "StatePreprocessor":
        loaded = joblib.load(Path(path))
        if not isinstance(loaded, cls):
            raise TypeError("Saved artifact is not a StatePreprocessor")
        return loaded
