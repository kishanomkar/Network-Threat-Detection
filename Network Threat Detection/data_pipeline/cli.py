"""Command-line entry point for the additive Person 1 preprocessing pipeline."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from .pipeline import run_chronological_split_pipeline, run_pipeline


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate time-windowed network states and communication graphs")
    parser.add_argument("--input", required=True, help="Timestamped flow CSV or classic Ethernet/IPv4 PCAP")
    parser.add_argument("--output-dir", default="network_states", help="Directory for new JSONL artifacts")
    parser.add_argument("--dataset", required=True, help="Dataset name, for example CSE-CIC-IDS2018")
    parser.add_argument("--scenario", required=True, help="Scenario/capture identifier")
    split_mode = parser.add_mutually_exclusive_group()
    split_mode.add_argument("--split", choices=["train", "validation", "test", "demo"], help="Label one standalone run with its split")
    split_mode.add_argument(
        "--chronological-splits",
        action="store_true",
        help="Write contiguous train/validation/test states and fit preprocessing on train only",
    )
    parser.add_argument("--window-seconds", type=int, help="Override the configured 10-second window")
    parser.add_argument("--config", help="Optional alternate pipeline configuration JSON")
    return parser


def main() -> None:
    arguments = build_parser().parse_args()
    if arguments.chronological_splits:
        manifest = run_chronological_split_pipeline(
            arguments.input,
            Path(arguments.output_dir),
            dataset=arguments.dataset,
            scenario=arguments.scenario,
            window_seconds=arguments.window_seconds,
            config_path=arguments.config,
        )
    else:
        manifest = run_pipeline(
            arguments.input,
            Path(arguments.output_dir),
            dataset=arguments.dataset,
            scenario=arguments.scenario,
            split=arguments.split,
            window_seconds=arguments.window_seconds,
            config_path=arguments.config,
        )
    print(json.dumps(manifest, indent=2, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()
