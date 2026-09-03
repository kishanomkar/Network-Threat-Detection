"""Canonical API and model contracts for network attack forecasting."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class DatasetKind(str, Enum):
    CIC_IDS_2018 = "CIC-IDS2018"
    CTU_13 = "CTU-13"
    UNSW_NB15 = "UNSW-NB15"
    GENERIC_CSV = "Generic CSV"
    PCAP = "PCAP"
    SYNTHETIC = "Synthetic"


class SplitName(str, Enum):
    TRAIN = "train"
    VALIDATION = "validation"
    TEST = "test"
    DEMO = "demo"


class AttackStage(str, Enum):
    BENIGN = "Benign"
    RECONNAISSANCE = "Reconnaissance"
    INITIAL_ACCESS = "Initial Access"
    EXECUTION = "Execution"
    PERSISTENCE = "Persistence"
    PRIVILEGE_ESCALATION = "Privilege Escalation"
    LATERAL_MOVEMENT = "Lateral Movement"
    COMMAND_AND_CONTROL = "Command and Control"
    EXFILTRATION = "Exfiltration"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class StateSource(BaseModel):
    dataset: DatasetKind | str
    scenario: str
    capture_id: str | None = None
    split: SplitName | None = None


class NetworkState(BaseModel):
    """Stable state object passed from ingestion into temporal models."""

    model_config = ConfigDict(extra="forbid")

    schema_version: Literal["1.0"] = "1.0"
    state_id: str
    timestamp: datetime
    window_start: datetime
    window_end: datetime
    window_seconds: int = Field(ge=1)
    source: StateSource
    flow_count: int = Field(ge=0)
    packet_count: float = Field(ge=0)
    unique_sources: int = Field(ge=0)
    unique_destinations: int = Field(ge=0)
    unique_ports: int = Field(ge=0)
    bytes_total: float = Field(ge=0)
    packets_total: float = Field(ge=0)
    syn_rate: float = Field(ge=0)
    ack_rate: float = Field(ge=0)
    rst_rate: float = Field(ge=0)
    mean_iat: float = Field(ge=0)
    iat_std: float = Field(ge=0)
    port_fanout: int = Field(ge=0)
    host_fanout: int = Field(ge=0)
    scan_score: float = Field(ge=0, le=1)
    beacon_score: float = Field(ge=0, le=1)
    exfiltration_score: float = Field(ge=0, le=1)
    ttl_mean: float = Field(ge=0)
    ttl_std: float = Field(ge=0)
    packet_size_mean: float = Field(ge=0)
    packet_size_std: float = Field(ge=0)
    outbound_bytes: float = Field(ge=0)
    inbound_bytes: float = Field(ge=0)
    protocol_distribution: dict[str, int] = Field(default_factory=dict)
    feature_vector: list[float] = Field(default_factory=list)
    raw_state: dict[str, Any] = Field(default_factory=dict)


class GraphNode(BaseModel):
    id: str
    ip_address: str
    in_degree: int = Field(ge=0)
    out_degree: int = Field(ge=0)
    bytes_sent: float | None = Field(default=None, ge=0)
    bytes_received: float | None = Field(default=None, ge=0)
    role_hint: Literal["internal", "external", "unknown"] = "unknown"
    risk: float = Field(default=0.0, ge=0, le=1)


class GraphEdge(BaseModel):
    source: str
    target: str
    packet_count: float | None = Field(default=None, ge=0)
    byte_count: float | None = Field(default=None, ge=0)
    flow_count: int = Field(ge=0)
    protocol_counts: dict[str, int] = Field(default_factory=dict)
    dst_ports: list[int] = Field(default_factory=list)
    risk: float = Field(default=0.0, ge=0, le=1)


class GraphState(BaseModel):
    schema_version: Literal["1.0"] = "1.0"
    state_id: str
    timestamp: datetime
    window_seconds: int = Field(ge=1)
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class ForecastStep(BaseModel):
    step: int = Field(ge=1)
    risk: float = Field(ge=0, le=1)
    stage: AttackStage
    confidence: float = Field(ge=0, le=1)


class ModelInput(BaseModel):
    sequence_length: int = Field(ge=1)
    feature_count: int = Field(ge=1)
    states: list[NetworkState]
    feature_matrix: list[list[float]]
    graph_sequence: list[GraphState] = Field(default_factory=list)
    horizon: int = Field(default=5, ge=1)
    model: Literal["lstm", "transformer", "antcm", "fallback"] = "fallback"


class StateSequence(BaseModel):
    sequence_id: str
    states: list[NetworkState]
    feature_matrix: list[list[float]]
    sequence_length: int = Field(ge=1)
    start_timestamp: datetime
    end_timestamp: datetime


class SequenceTarget(BaseModel):
    next_state: NetworkState
    next_feature_vector: list[float]
    attack_probability: float = Field(ge=0, le=1)
    attack_stage: AttackStage
    label: str


class SequenceExample(BaseModel):
    sequence: StateSequence
    target: SequenceTarget


class ModelOutput(BaseModel):
    timestamp: datetime
    current_risk: float = Field(ge=0, le=1)
    predicted_risk: float = Field(ge=0, le=1)
    predicted_stage: AttackStage
    confidence: float = Field(ge=0, le=1)
    forecast: list[ForecastStep]
    evidence: list[str] = Field(default_factory=list)
    top_features: list[str] = Field(default_factory=list)
    model: str
    model_version: str


class Alert(BaseModel):
    id: str
    timestamp: datetime
    flow_id: str | None = None
    source_ip: str | None = None
    destination_ip: str | None = None
    threat_class: str
    current_stage: AttackStage
    predicted_stage: AttackStage
    risk_score: int = Field(ge=0, le=100)
    risk_level: RiskLevel
    confidence: float = Field(ge=0, le=1)
    forecast_horizon: int = Field(ge=1)
    evidence: list[str] = Field(default_factory=list)
    top_features: list[str] = Field(default_factory=list)
    mitre: list[dict[str, str]] = Field(default_factory=list)
    model: str
    model_version: str
