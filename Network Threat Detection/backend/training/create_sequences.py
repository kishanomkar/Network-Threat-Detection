"""Create temporal training examples from chronological network states."""

from __future__ import annotations

import json
import argparse
from collections.abc import Iterable
from pathlib import Path
from typing import Any

import numpy as np

from backend.app.schemas import AttackStage, NetworkState, SequenceExample, SequenceTarget, StateSequence
from backend.app.state import build_canonical_states
from backend.data_adapters import get_adapter


ATTACK_LABEL_HINTS: tuple[tuple[str, AttackStage], ...] = (
    ("benign", AttackStage.BENIGN),
    ("normal", AttackStage.BENIGN),
    ("scan", AttackStage.RECONNAISSANCE),
    ("recon", AttackStage.RECONNAISSANCE),
    ("brute force", AttackStage.INITIAL_ACCESS),
    ("ssh", AttackStage.INITIAL_ACCESS),
    ("web", AttackStage.INITIAL_ACCESS),
    ("dos", AttackStage.EXECUTION),
    ("ddos", AttackStage.EXECUTION),
    ("hulk", AttackStage.EXECUTION),
    ("slowloris", AttackStage.EXECUTION),
    ("bot", AttackStage.COMMAND_AND_CONTROL),
    ("c2", AttackStage.COMMAND_AND_CONTROL),
    ("infil", AttackStage.EXFILTRATION),
    ("exfil", AttackStage.EXFILTRATION),
)


def create_sequence_examples(
    states: Iterable[NetworkState],
    *,
    sequence_length: int = 10,
    forecast_offset: int = 1,
) -> list[SequenceExample]:
    """Create sliding-window examples: S(t-n)..S(t) -> S(t+offset)."""
    if sequence_length < 1:
        raise ValueError("sequence_length must be at least 1")
    if forecast_offset < 1:
        raise ValueError("forecast_offset must be at least 1")

    ordered_states = sorted(states, key=lambda state: state.timestamp)
    required = sequence_length + forecast_offset
    if len(ordered_states) < required:
        return []

    examples: list[SequenceExample] = []
    for start in range(0, len(ordered_states) - required + 1):
        sequence_states = ordered_states[start : start + sequence_length]
        target_state = ordered_states[start + sequence_length + forecast_offset - 1]
        examples.append(_build_example(sequence_states, target_state, start))
    return examples


def save_sequence_examples(examples: Iterable[SequenceExample], path: str | Path) -> Path:
    """Persist sequence examples as JSONL for reproducible training runs."""
    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as stream:
        for example in examples:
            stream.write(json.dumps(example.model_dump(mode="json"), sort_keys=True))
            stream.write("\n")
    return output_path


def load_sequence_examples(path: str | Path) -> list[SequenceExample]:
    """Load JSONL sequence examples written by `save_sequence_examples`."""
    input_path = Path(path)
    examples: list[SequenceExample] = []
    with input_path.open("r", encoding="utf-8") as stream:
        for line_number, line in enumerate(stream, start=1):
            if not line.strip():
                continue
            try:
                examples.append(SequenceExample.model_validate_json(line))
            except ValueError as exc:
                raise ValueError(f"Invalid sequence JSONL at line {line_number}: {exc}") from exc
    return examples


def examples_to_numpy(examples: Iterable[SequenceExample]) -> dict[str, Any]:
    """Convert examples into arrays used by baseline and world-model training."""
    example_list = list(examples)
    if not example_list:
        raise ValueError("At least one sequence example is required")
    x = np.nan_to_num(np.asarray([example.sequence.feature_matrix for example in example_list], dtype=float))
    y_next_state = np.nan_to_num(np.asarray([example.target.next_feature_vector for example in example_list], dtype=float))
    y_attack = np.asarray([example.target.attack_probability for example in example_list], dtype=float)
    stages = [stage.value for stage in AttackStage]
    y_stage = np.asarray([stages.index(example.target.attack_stage.value) for example in example_list], dtype=int)
    return {
        "x": x,
        "y_next_state": y_next_state,
        "y_attack": y_attack,
        "y_stage": y_stage,
        "stage_labels": stages,
    }


def infer_attack_stage(state: NetworkState) -> AttackStage:
    label = str(state.raw_state.get("ground_truth", {}).get("current_label", "")).lower()
    for token, stage in ATTACK_LABEL_HINTS:
        if token in label:
            return stage
    if state.exfiltration_score >= 0.7:
        return AttackStage.EXFILTRATION
    if state.beacon_score >= 0.8 and state.bytes_total > 0:
        return AttackStage.COMMAND_AND_CONTROL
    if state.scan_score >= 0.35:
        return AttackStage.RECONNAISSANCE
    return AttackStage.BENIGN


def infer_attack_probability(state: NetworkState) -> float:
    stage = infer_attack_stage(state)
    if stage == AttackStage.BENIGN:
        return round(max(state.scan_score, state.beacon_score, state.exfiltration_score) * 0.4, 4)
    score = max(state.scan_score, state.beacon_score, state.exfiltration_score, 0.5)
    return round(min(1.0, score), 4)


def _build_example(sequence_states: list[NetworkState], target_state: NetworkState, index: int) -> SequenceExample:
    sequence = StateSequence(
        sequence_id=f"{sequence_states[0].state_id}__to__{sequence_states[-1].state_id}__{index}",
        states=sequence_states,
        feature_matrix=[state.feature_vector for state in sequence_states],
        sequence_length=len(sequence_states),
        start_timestamp=sequence_states[0].timestamp,
        end_timestamp=sequence_states[-1].timestamp,
    )
    stage = infer_attack_stage(target_state)
    label = str(target_state.raw_state.get("ground_truth", {}).get("current_label", stage.value))
    target = SequenceTarget(
        next_state=target_state,
        next_feature_vector=target_state.feature_vector,
        attack_probability=infer_attack_probability(target_state),
        attack_stage=stage,
        label=label,
    )
    return SequenceExample(sequence=sequence, target=target)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Create temporal NetworkState sequence examples")
    parser.add_argument("--input", required=True, help="Local CSV or PCAP path")
    parser.add_argument("--dataset", default="Generic CSV", help="Dataset adapter name")
    parser.add_argument("--scenario", default="cli", help="Scenario label for generated states")
    parser.add_argument("--capture-id", default="local", help="Capture id for generated states")
    parser.add_argument("--window-seconds", type=int, default=10)
    parser.add_argument("--sequence-length", type=int, default=10)
    parser.add_argument("--forecast-offset", type=int, default=1)
    parser.add_argument("--max-records", type=int, default=100000)
    parser.add_argument("--output", required=True, help="Output JSONL path")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    adapter = get_adapter(args.dataset)
    result = adapter.load(args.input)
    states = build_canonical_states(
        result.records.head(args.max_records),
        window_seconds=args.window_seconds,
        dataset=result.dataset,
        scenario=args.scenario,
        capture_id=args.capture_id,
        split="demo",
    )
    examples = create_sequence_examples(
        states,
        sequence_length=args.sequence_length,
        forecast_offset=args.forecast_offset,
    )
    output_path = save_sequence_examples(examples, args.output)
    print(
        json.dumps(
            {
                "state_count": len(states),
                "sequence_count": len(examples),
                "output": str(output_path),
                "warnings": result.warnings,
            },
            indent=2,
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
