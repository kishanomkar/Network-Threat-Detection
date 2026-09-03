"""Minimal utilities required by ANTCM notebook compatibility."""

from __future__ import annotations

from typing import Any


class Dataset:
    def __init__(self, x: Any, y: Any) -> None:
        self.x = x
        self.y = y

    def __len__(self) -> int:
        return len(self.x)

    def __getitem__(self, index: int) -> tuple[Any, Any]:
        return self.x[index], self.y[index]

