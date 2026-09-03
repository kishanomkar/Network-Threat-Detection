"""Normalisation of timestamped network-flow CSV data into a canonical frame."""

from __future__ import annotations

import re
from collections.abc import Iterable
from typing import Any

import pandas as pd


CANONICAL_COLUMNS = [
    "timestamp",
    "src_ip",
    "dst_ip",
    "src_port",
    "dst_port",
    "protocol",
    "packet_count",
    "byte_count",
    "flow_duration_ms",
    "syn_count",
    "ack_count",
    "fin_count",
    "rst_count",
    "psh_count",
    "urg_count",
    "iat_mean_ms",
    "iat_std_ms",
    "iat_max_ms",
    "ttl",
    "tcp_window_size",
    "retransmission_count",
    "fragment_count",
    "label",
]


def normalise_column_name(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def _matching_column(frame: pd.DataFrame, aliases: Iterable[str]) -> str | None:
    normalised = {normalise_column_name(str(column)): str(column) for column in frame.columns}
    for alias in aliases:
        match = normalised.get(normalise_column_name(alias))
        if match is not None:
            return match
    return None


def _numeric_column(frame: pd.DataFrame, aliases: Iterable[str]) -> pd.Series:
    column = _matching_column(frame, aliases)
    if column is None:
        return pd.Series(float("nan"), index=frame.index, dtype="float64")
    return pd.to_numeric(frame[column], errors="coerce")


def _combined_numeric_column(
    frame: pd.DataFrame,
    direct_aliases: Iterable[str],
    component_aliases: Iterable[Iterable[str]],
) -> pd.Series:
    direct = _numeric_column(frame, direct_aliases)
    if direct.notna().any():
        return direct

    components = [_numeric_column(frame, aliases) for aliases in component_aliases]
    if not components or not any(component.notna().any() for component in components):
        return direct
    return pd.concat(components, axis=1).sum(axis=1, min_count=1)


def _flow_duration_ms(frame: pd.DataFrame, config: dict[str, Any]) -> pd.Series:
    """Read source-specific flow duration and return milliseconds.

    CICFlowMeter's ``Flow Duration`` is measured in microseconds, whereas the
    CTU-13 ``Dur`` field is in seconds.  The unit mapping is deliberately kept
    in the editable pipeline configuration instead of being inferred from the
    numbers, which would be unreliable for short flows.
    """
    aliases = config["column_aliases"]["flow_duration"]
    column = _matching_column(frame, aliases)
    if column is None:
        return pd.Series(float("nan"), index=frame.index, dtype="float64")

    unit = config.get("duration_units", {}).get(normalise_column_name(column), "milliseconds")
    multipliers = {
        "seconds": 1_000.0,
        "milliseconds": 1.0,
        "microseconds": 0.001,
        "nanoseconds": 0.000001,
    }
    if unit not in multipliers:
        raise ValueError(f"Unsupported duration unit '{unit}' for column '{column}'")
    return pd.to_numeric(frame[column], errors="coerce") * multipliers[unit]


def _parse_timestamps(values: pd.Series) -> pd.Series:
    numeric = pd.to_numeric(values, errors="coerce")
    if numeric.notna().all():
        magnitude = numeric.abs().median()
        unit = "ns" if magnitude >= 1e17 else "us" if magnitude >= 1e14 else "ms" if magnitude >= 1e11 else "s"
        return pd.to_datetime(numeric, unit=unit, utc=True, errors="coerce")
    return pd.to_datetime(values, utc=True, errors="coerce")


def _clean_string(values: pd.Series, fallback: str | None = None) -> pd.Series:
    cleaned = values.astype("string").str.strip()
    cleaned = cleaned.mask(cleaned.isin(["", "<NA>", "nan", "None"]))
    return cleaned.fillna(fallback) if fallback is not None else cleaned


def normalise_flow_frame(frame: pd.DataFrame, config: dict[str, Any]) -> pd.DataFrame:
    """Map a timestamped flow CSV onto the canonical Person 1 record layout.

    A CSV must provide a timestamp and source/destination IP addresses. Other fields are
    preserved as missing when unavailable rather than being fabricated.
    """
    aliases = config["column_aliases"]
    required_columns: dict[str, str] = {}
    for field in config["required_canonical_fields"]:
        column = _matching_column(frame, aliases[field])
        if column is None:
            raise ValueError(
                f"Input CSV is missing the required '{field}' field. "
                f"Accepted aliases: {', '.join(aliases[field])}"
            )
        required_columns[field] = column

    result = pd.DataFrame(index=frame.index)
    result["timestamp"] = _parse_timestamps(frame[required_columns["timestamp"]])
    result["src_ip"] = _clean_string(frame[required_columns["src_ip"]])
    result["dst_ip"] = _clean_string(frame[required_columns["dst_ip"]])

    for field in ("src_port", "dst_port"):
        result[field] = _numeric_column(frame, aliases[field]).round().astype("Int64")

    protocol_column = _matching_column(frame, aliases["protocol"])
    result["protocol"] = (
        _clean_string(frame[protocol_column], fallback="UNKNOWN").str.upper()
        if protocol_column is not None
        else pd.Series("UNKNOWN", index=frame.index, dtype="string")
    )

    result["packet_count"] = _combined_numeric_column(
        frame,
        aliases["packet_count"],
        [aliases["fwd_packet_count"], aliases["bwd_packet_count"]],
    )
    result["byte_count"] = _combined_numeric_column(
        frame,
        aliases["byte_count"],
        [aliases["fwd_byte_count"], aliases["bwd_byte_count"]],
    )
    result["flow_duration_ms"] = _flow_duration_ms(frame, config)

    for field in (
        "syn_count",
        "ack_count",
        "fin_count",
        "rst_count",
        "psh_count",
        "urg_count",
        "iat_mean_ms",
        "iat_std_ms",
        "iat_max_ms",
        "ttl",
        "tcp_window_size",
        "retransmission_count",
        "fragment_count",
    ):
        result[field] = _numeric_column(frame, aliases[field])

    label_column = _matching_column(frame, aliases["label"])
    result["label"] = (
        _clean_string(frame[label_column])
        if label_column is not None
        else pd.Series(pd.NA, index=frame.index, dtype="string")
    )

    result = result.dropna(subset=["timestamp", "src_ip", "dst_ip"]).sort_values("timestamp").reset_index(drop=True)
    if result.empty:
        raise ValueError("No usable records remain after validating timestamp and IP fields")
    return result[CANONICAL_COLUMNS]


def normalise_packet_frame(frame: pd.DataFrame) -> pd.DataFrame:
    """Validate classic-PCAP records already emitted in the canonical layout."""
    # A packet is an instantaneous event, not a completed flow. Keep its flow
    # duration explicitly unavailable instead of treating capture timing as a
    # fabricated duration measurement.
    if "flow_duration_ms" not in frame.columns:
        frame = frame.copy()
        frame["flow_duration_ms"] = float("nan")
    missing = sorted(set(CANONICAL_COLUMNS) - set(frame.columns))
    if missing:
        raise ValueError(f"PCAP parser did not provide canonical fields: {missing}")
    result = frame.copy()
    result["timestamp"] = pd.to_datetime(result["timestamp"], utc=True, errors="coerce")
    result = result.dropna(subset=["timestamp", "src_ip", "dst_ip"]).sort_values("timestamp").reset_index(drop=True)
    if result.empty:
        raise ValueError("No supported IPv4 packet records were found in the PCAP")
    return result[CANONICAL_COLUMNS]
