"""End-to-end Person 1 ingestion, state generation and graph export."""

from __future__ import annotations

from collections import Counter
import hashlib
import json
import math
from pathlib import Path
from typing import Any

import pandas as pd

from graph_builder import build_graph_state

from .config import load_pipeline_config
from .flow import normalise_flow_frame, normalise_packet_frame
from .pcap import read_classic_pcap
from .preprocessing import StatePreprocessor
from .states import iter_windowed_states


SPLIT_NAMES = ("train", "validation", "test")


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1_048_576), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _write_jsonl(path: Path, records: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as stream:
        for record in records:
            stream.write(json.dumps(record, ensure_ascii=False, allow_nan=False, sort_keys=True))
            stream.write("\n")


def _read_input(input_path: Path, config: dict[str, Any]) -> tuple[pd.DataFrame, str]:
    suffix = input_path.suffix.lower()
    if suffix == ".csv":
        return normalise_flow_frame(pd.read_csv(input_path), config), "flow_csv"
    if suffix == ".pcap":
        return normalise_packet_frame(read_classic_pcap(input_path)), "classic_pcap"
    raise ValueError("Supported inputs are timestamped flow CSV files and classic .pcap captures")


def _build_state_graph_records(
    records: pd.DataFrame,
    *,
    window_seconds: int,
    dataset: str,
    scenario: str,
    capture_id: str,
    split: str | None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    states: list[dict[str, Any]] = []
    graphs: list[dict[str, Any]] = []
    for state, window_records in iter_windowed_states(
        records,
        window_seconds=window_seconds,
        dataset=dataset,
        scenario=scenario,
        capture_id=capture_id,
        split=split,
    ):
        states.append(state)
        graphs.append(build_graph_state(state, window_records))
    return states, graphs


def _chronological_split_counts(total: int, ratios: dict[str, Any]) -> dict[str, int]:
    """Allocate ordered state windows to train/validation/test without overlap."""
    if total < len(SPLIT_NAMES):
        raise ValueError("At least three time-window states are required for train/validation/test splitting")
    try:
        numeric_ratios = {name: float(ratios[name]) for name in SPLIT_NAMES}
    except (KeyError, TypeError, ValueError) as exc:
        raise ValueError("chronological_split_ratios must define train, validation and test") from exc
    if any(value <= 0 for value in numeric_ratios.values()) or not math.isclose(
        sum(numeric_ratios.values()), 1.0, abs_tol=1e-9
    ):
        raise ValueError("chronological_split_ratios must be positive and sum to 1.0")

    raw = {name: total * numeric_ratios[name] for name in SPLIT_NAMES}
    counts = {name: int(math.floor(raw[name])) for name in SPLIT_NAMES}
    remainder = total - sum(counts.values())
    for name in sorted(SPLIT_NAMES, key=lambda item: raw[item] - counts[item], reverse=True)[:remainder]:
        counts[name] += 1

    # Ensure every chronological partition is represented, even in a small
    # fixture capture. Move one state from the largest donor as needed.
    for recipient in SPLIT_NAMES:
        if counts[recipient] != 0:
            continue
        donor = max(SPLIT_NAMES, key=lambda name: counts[name])
        if counts[donor] <= 1:
            raise ValueError("Unable to allocate at least one state to every chronological split")
        counts[donor] -= 1
        counts[recipient] += 1
    return counts


def _label_counts(states: list[dict[str, Any]]) -> dict[str, int]:
    labels = Counter(
        state.get("ground_truth", {}).get("current_label", "UNLABELLED")
        for state in states
    )
    return dict(sorted(labels.items()))


def run_pipeline(
    input_path: str | Path,
    output_dir: str | Path,
    *,
    dataset: str,
    scenario: str,
    split: str | None = None,
    window_seconds: int | None = None,
    config_path: str | Path | None = None,
) -> dict[str, Any]:
    """Process one capture into JSONL state/graph artifacts and a reproducibility manifest."""
    source_path = Path(input_path)
    if not source_path.is_file():
        raise FileNotFoundError(f"Input file was not found: {source_path}")
    config = load_pipeline_config(config_path)
    seconds = window_seconds or int(config["default_window_seconds"])
    if seconds < 1:
        raise ValueError("window_seconds must be at least 1")
    if split not in {None, "train", "validation", "test", "demo"}:
        raise ValueError("split must be one of train, validation, test or demo")

    records, input_kind = _read_input(source_path, config)
    states, graphs = _build_state_graph_records(
        records,
        window_seconds=seconds,
        dataset=dataset,
        scenario=scenario,
        capture_id=source_path.stem,
        split=split,
    )

    destination = Path(output_dir)
    destination.mkdir(parents=True, exist_ok=True)
    state_path = destination / f"{source_path.stem}.network_states.jsonl"
    graph_path = destination / f"{source_path.stem}.graph_states.jsonl"
    manifest_path = destination / f"{source_path.stem}.manifest.json"
    _write_jsonl(state_path, states)
    _write_jsonl(graph_path, graphs)
    manifest = {
        "schema_version": "1.0",
        "input": {
            "path": str(source_path),
            "sha256": _sha256(source_path),
            "kind": input_kind,
            "record_count": int(len(records)),
        },
        "source": {"dataset": dataset, "scenario": scenario, "split": split},
        "window_seconds": seconds,
        "state_count": len(states),
        "outputs": {"network_states": str(state_path), "graph_states": str(graph_path)},
    }
    manifest["outputs"]["manifest"] = str(manifest_path)
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")
    return manifest


def run_chronological_split_pipeline(
    input_path: str | Path,
    output_dir: str | Path,
    *,
    dataset: str,
    scenario: str,
    window_seconds: int | None = None,
    config_path: str | Path | None = None,
) -> dict[str, Any]:
    """Create leakage-safe chronological train/validation/test state datasets.

    The input is first converted to time-windowed states, then those states are
    partitioned into contiguous time ranges. The preprocessor is fitted only on
    the earliest (training) range; labels remain annotations and are never
    included in the scaler input.
    """
    source_path = Path(input_path)
    if not source_path.is_file():
        raise FileNotFoundError(f"Input file was not found: {source_path}")
    config = load_pipeline_config(config_path)
    seconds = window_seconds or int(config["default_window_seconds"])
    if seconds < 1:
        raise ValueError("window_seconds must be at least 1")

    records, input_kind = _read_input(source_path, config)
    states, graphs = _build_state_graph_records(
        records,
        window_seconds=seconds,
        dataset=dataset,
        scenario=scenario,
        capture_id=source_path.stem,
        split=None,
    )
    counts = _chronological_split_counts(len(states), config["chronological_split_ratios"])

    destination = Path(output_dir)
    destination.mkdir(parents=True, exist_ok=True)
    split_states: dict[str, list[dict[str, Any]]] = {}
    split_graphs: dict[str, list[dict[str, Any]]] = {}
    outputs: dict[str, dict[str, str]] = {}
    index = 0
    for split_name in SPLIT_NAMES:
        next_index = index + counts[split_name]
        selected_states = states[index:next_index]
        selected_graphs = graphs[index:next_index]
        for state in selected_states:
            state["source"]["split"] = split_name
        split_states[split_name] = selected_states
        split_graphs[split_name] = selected_graphs

        state_path = destination / f"{source_path.stem}.{split_name}.network_states.jsonl"
        graph_path = destination / f"{source_path.stem}.{split_name}.graph_states.jsonl"
        _write_jsonl(state_path, selected_states)
        _write_jsonl(graph_path, selected_graphs)
        outputs[split_name] = {
            "network_states": str(state_path),
            "graph_states": str(graph_path),
        }
        index = next_index

    preprocessing_dir = destination / "preprocessing"
    preprocessor = StatePreprocessor().fit(split_states["train"])
    preprocessor_path = preprocessor.save(preprocessing_dir / "state_preprocessor.joblib")
    metadata_path = preprocessing_dir / "state_preprocessor.metadata.json"
    preprocessing_metadata = {
        "fitted_on_split": "train",
        "training_state_count": len(split_states["train"]),
        "training_time_range": {
            "start": split_states["train"][0]["timestamp"],
            "end": split_states["train"][-1]["timestamp"],
        },
        **preprocessor.metadata(),
    }
    metadata_path.write_text(
        json.dumps(preprocessing_metadata, indent=2, ensure_ascii=False, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    manifest_path = destination / f"{source_path.stem}.chronological_split.manifest.json"
    manifest = {
        "schema_version": "1.0",
        "input": {
            "path": str(source_path),
            "sha256": _sha256(source_path),
            "kind": input_kind,
            "record_count": int(len(records)),
        },
        "source": {"dataset": dataset, "scenario": scenario},
        "window_seconds": seconds,
        "split_ratios": config["chronological_split_ratios"],
        "splits": {
            split_name: {
                "state_count": len(split_states[split_name]),
                "start_timestamp": split_states[split_name][0]["timestamp"],
                "end_timestamp": split_states[split_name][-1]["timestamp"],
                "state_label_counts": _label_counts(split_states[split_name]),
                **outputs[split_name],
            }
            for split_name in SPLIT_NAMES
        },
        "preprocessing": {
            "artifact": str(preprocessor_path),
            "metadata": str(metadata_path),
            "fitted_on_split": "train",
        },
    }
    manifest["manifest"] = str(manifest_path)
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")
    return manifest
