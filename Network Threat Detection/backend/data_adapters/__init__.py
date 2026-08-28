"""Dataset adapter registry for CSV, PCAP, and benchmark datasets."""

from .base import AdapterResult, DatasetAdapter, get_adapter

__all__ = ["AdapterResult", "DatasetAdapter", "get_adapter"]

