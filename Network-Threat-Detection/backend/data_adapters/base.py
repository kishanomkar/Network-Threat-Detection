"""Dataset adapter interfaces and registry."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

import pandas as pd

from backend.app.schemas import DatasetKind
from data_pipeline.config import load_pipeline_config
from data_pipeline.flow import normalise_flow_frame, normalise_packet_frame
from data_pipeline.pcap import read_classic_pcap


@dataclass(frozen=True)
class AdapterResult:
    records: pd.DataFrame
    dataset: str
    source_kind: str
    warnings: list[str]


class DatasetAdapter(Protocol):
    dataset: DatasetKind

    def load(self, path: str | Path) -> AdapterResult:
        """Load and normalize source traffic into Person 1 canonical records."""


from functools import lru_cache

@lru_cache(maxsize=16)
def _cached_load_pcap(path_str: str) -> AdapterResult:
    records = normalise_packet_frame(read_classic_pcap(Path(path_str)))
    warnings = ["Flow duration is unavailable for packet-only PCAP input."]
    return AdapterResult(records=records, dataset=DatasetKind.PCAP.value, source_kind="classic_pcap", warnings=warnings)


@lru_cache(maxsize=16)
def _cached_load_csv(path_str: str, dataset_value: str) -> AdapterResult:
    config = load_pipeline_config()
    records = normalise_flow_frame(pd.read_csv(path_str), config)
    return AdapterResult(records=records, dataset=dataset_value, source_kind="flow_csv", warnings=[])


class GenericCsvAdapter:
    dataset = DatasetKind.GENERIC_CSV

    def load(self, path: str | Path) -> AdapterResult:
        path_str = str(Path(path).resolve())
        return _cached_load_csv(path_str, self.dataset.value)


class CicIds2018Adapter(GenericCsvAdapter):
    dataset = DatasetKind.CIC_IDS_2018


class Ctu13Adapter(GenericCsvAdapter):
    dataset = DatasetKind.CTU_13


class UnswNb15Adapter(GenericCsvAdapter):
    dataset = DatasetKind.UNSW_NB15


class PcapAdapter:
    dataset = DatasetKind.PCAP

    def load(self, path: str | Path) -> AdapterResult:
        path_str = str(Path(path).resolve())
        return _cached_load_pcap(path_str)


def get_adapter(dataset: DatasetKind | str) -> DatasetAdapter:
    key = dataset.value if isinstance(dataset, DatasetKind) else dataset
    adapters: dict[str, DatasetAdapter] = {
        DatasetKind.CIC_IDS_2018.value: CicIds2018Adapter(),
        DatasetKind.CTU_13.value: Ctu13Adapter(),
        DatasetKind.UNSW_NB15.value: UnswNb15Adapter(),
        DatasetKind.GENERIC_CSV.value: GenericCsvAdapter(),
        DatasetKind.PCAP.value: PcapAdapter(),
    }
    try:
        return adapters[key]
    except KeyError as exc:
        supported = ", ".join(sorted(adapters))
        raise ValueError(f"Unsupported dataset '{key}'. Supported datasets: {supported}") from exc

