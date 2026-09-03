"""Inspect the notebook-trained ANTCM artifact with a timeout.

Run this with the Python interpreter that has PyTorch installed:

    python scripts/inspect_antcm.py
"""

from __future__ import annotations

import multiprocessing as mp
from pathlib import Path
from queue import Empty
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def _inspect(queue: mp.Queue) -> None:
    from backend.app.models import ModelRegistry

    model = ModelRegistry(PROJECT_ROOT).load("antcm")
    queue.put(
        {
            "expected_feature_count": model.expected_feature_count,
            "classes": model.classes,
            "classifier_type": type(model.classifier).__name__,
            "inner_classifier_type": type(model.inner_classifier).__name__,
        }
    )


def main(timeout_seconds: int = 120) -> dict[str, Any]:
    queue: mp.Queue = mp.Queue()
    process = mp.Process(target=_inspect, args=(queue,))
    process.start()
    try:
        result = queue.get(timeout=timeout_seconds)
    except Empty:
        process.terminate()
        process.join(timeout=5)
        result = {
            "error": f"ANTCM inspection timed out after {timeout_seconds} seconds",
            "hint": "The pickle is large and was saved from a notebook runtime; use a smaller exported sklearn artifact if possible.",
        }
    else:
        process.join(timeout=5)
    print(result)
    return result


if __name__ == "__main__":
    main()
