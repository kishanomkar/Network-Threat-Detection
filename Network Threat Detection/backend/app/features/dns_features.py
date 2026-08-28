"""Optional DNS feature extraction."""

from __future__ import annotations

from dataclasses import dataclass
from math import log2
from typing import Any

import pandas as pd


@dataclass(frozen=True)
class DnsFeatures:
    enabled: bool
    query_count: int
    mean_query_length: float
    mean_domain_entropy: float
    mean_subdomain_count: float
    mean_digit_ratio: float

    def as_dict(self) -> dict[str, Any]:
        return self.__dict__.copy()


def calculate_dns_features(records: pd.DataFrame, query_column: str = "dns_query") -> DnsFeatures:
    if query_column not in records.columns:
        return DnsFeatures(False, 0, 0.0, 0.0, 0.0, 0.0)
    queries = records[query_column].dropna().astype(str).str.strip()
    queries = queries[queries != ""]
    if queries.empty:
        return DnsFeatures(True, 0, 0.0, 0.0, 0.0, 0.0)
    return DnsFeatures(
        enabled=True,
        query_count=int(len(queries)),
        mean_query_length=float(queries.str.len().mean()),
        mean_domain_entropy=float(queries.map(_entropy).mean()),
        mean_subdomain_count=float(queries.map(lambda item: max(item.count(".") - 1, 0)).mean()),
        mean_digit_ratio=float(queries.map(_digit_ratio).mean()),
    )


def _entropy(value: str) -> float:
    if not value:
        return 0.0
    counts = {character: value.count(character) for character in set(value)}
    return float(-sum((count / len(value)) * log2(count / len(value)) for count in counts.values()))


def _digit_ratio(value: str) -> float:
    return 0.0 if not value else sum(character.isdigit() for character in value) / len(value)

