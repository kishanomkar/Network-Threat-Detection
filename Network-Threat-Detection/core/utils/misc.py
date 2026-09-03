"""Compatibility exports for notebook imports."""

from __future__ import annotations

from typing import Any


def extend_dataset(*_: Any, **__: Any) -> tuple[list[Any], list[str]]:
    raise RuntimeError("extend_dataset is a training-time notebook helper and is not available in backend inference")

