"""Combined feature extraction facade."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import pandas as pd

from .behavior_features import BehaviorFeatures, calculate_behavior_features
from .dns_features import DnsFeatures, calculate_dns_features
from .flow_features import FlowFeatures, calculate_flow_features
from .packet_features import PacketFeatures, calculate_packet_features


@dataclass(frozen=True)
class FeatureBundle:
    flow: FlowFeatures
    packet: PacketFeatures
    behavior: BehaviorFeatures
    dns: DnsFeatures

    def as_dict(self) -> dict[str, Any]:
        return {
            "flow": self.flow.as_dict(),
            "packet": self.packet.as_dict(),
            "behavior": self.behavior.as_dict(),
            "dns": self.dns.as_dict(),
        }


def extract_feature_bundle(
    records: pd.DataFrame,
    *,
    window_seconds: int,
    internal_prefixes: tuple[str, ...] = (),
) -> FeatureBundle:
    return FeatureBundle(
        flow=calculate_flow_features(records, window_seconds=window_seconds),
        packet=calculate_packet_features(records),
        behavior=calculate_behavior_features(records, window_seconds=window_seconds, internal_prefixes=internal_prefixes),
        dns=calculate_dns_features(records),
    )

