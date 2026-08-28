# Implementation Plan

## Phase 1 Repository Assessment

The repository is not empty. It already contains an older multi-model FastAPI app, a Vite React frontend, trained pickle files, notebooks, and a Person 1 traffic pipeline:

- `data_pipeline/`: converts timestamped flow CSV or classic PCAP into canonical records.
- `graph_builder/`: builds host communication graphs for each network-state window.
- `configs/`: stores pipeline configuration, feature dictionary, and JSON schemas.
- `network_states/`: stores generated Person 1 artifacts for Person 2 temporal modeling.
- `ANTCM_trained_model.pkl`: Person 2 trained artifact, currently not connected to the API.

The first implementation path should preserve Person 1's work and gradually move the project toward the requested SIH architecture under `backend/` while keeping compatibility with the existing demo app.

## Target Folder Structure

Phase 1 creates the missing structure:

```text
backend/
  app/
    api/
    ingestion/
    preprocessing/
    features/
    state/
    models/
    forecasting/
    mitre/
    explainability/
    risk/
    alerts/
    database/
  data_adapters/
  training/
  tests/
docs/
models/
scripts/
data/processed/
data/sample/
```

Existing Person 1 modules can later be migrated or wrapped instead of rewritten immediately.

## Dependencies

Core dependencies:

- Backend: `python>=3.11`, `fastapi`, `uvicorn`, `pydantic`, `python-multipart`.
- Data: `pandas`, `numpy`, `pyarrow`, `joblib`.
- Packet processing: `scapy`; optional `pyshark` only when `tshark` is installed.
- ML: `torch`, `scikit-learn`, `xgboost`.
- Explainability: `shap`.
- Graph: `networkx`.
- Database: `sqlalchemy`, `sqlite`.
- Testing: `pytest`, `httpx`.
- Frontend: Next.js, TypeScript, Tailwind CSS, Recharts, Cytoscape.js or React Flow.

The current root `requirements.txt` is minimal and should be expanded later or replaced by `backend/requirements.txt`.

## Module Interfaces

Dataset adapters:

```python
class DatasetAdapter:
    def load(path: str) -> pd.DataFrame: ...
    def normalize(frame: pd.DataFrame) -> pd.DataFrame: ...
```

Feature extraction:

```python
def extract_flow_features(records: pd.DataFrame) -> pd.DataFrame: ...
def extract_packet_features(records: pd.DataFrame) -> pd.DataFrame: ...
def extract_temporal_features(records: pd.DataFrame) -> pd.DataFrame: ...
```

State creation:

```python
def build_network_states(records: pd.DataFrame, window_seconds: int) -> list[NetworkState]: ...
def vectorize_state(state: NetworkState, schema: FeatureSchema) -> list[float]: ...
```

Forecasting:

```python
def create_sequences(states: list[NetworkState], sequence_length: int) -> SequenceBatch: ...
def forecast(sequence: list[NetworkState], horizon: int, model_name: str) -> ForecastResult: ...
```

Risk and alerts:

```python
def calculate_risk(forecast: ForecastResult, graph: GraphState | None) -> RiskResult: ...
def build_alert(forecast: ForecastResult, risk: RiskResult) -> Alert: ...
```

## Canonical NetworkState Schema

The existing `configs/network_state.schema.json` is the current contract. The backend should expose a stable Pydantic version with these normalized top-level fields for Person 2:

```json
{
  "schema_version": "1.0",
  "state_id": "string",
  "timestamp": "ISO-8601 UTC",
  "window_start": "ISO-8601 UTC",
  "window_end": "ISO-8601 UTC",
  "window_seconds": 10,
  "source": {
    "dataset": "CIC-IDS2018 | CTU-13 | UNSW-NB15 | Generic CSV | PCAP | Synthetic",
    "scenario": "string",
    "capture_id": "string",
    "split": "train | validation | test | demo"
  },
  "flow_count": 0,
  "packet_count": 0,
  "unique_sources": 0,
  "unique_destinations": 0,
  "unique_ports": 0,
  "bytes_total": 0,
  "packets_total": 0,
  "syn_rate": 0.0,
  "ack_rate": 0.0,
  "rst_rate": 0.0,
  "mean_iat": 0.0,
  "iat_std": 0.0,
  "port_fanout": 0,
  "host_fanout": 0,
  "scan_score": 0.0,
  "beacon_score": 0.0,
  "exfiltration_score": 0.0,
  "ttl_mean": 0.0,
  "ttl_std": 0.0,
  "packet_size_mean": 0.0,
  "packet_size_std": 0.0,
  "outbound_bytes": 0,
  "inbound_bytes": 0,
  "protocol_distribution": {},
  "feature_vector": []
}
```

This schema must remain stable. New fields should be optional additions or versioned as `schema_version: "1.1"`.

## Canonical Alert Schema

```json
{
  "id": "string",
  "timestamp": "ISO-8601 UTC",
  "flow_id": "string | null",
  "source_ip": "string | null",
  "destination_ip": "string | null",
  "threat_class": "string",
  "current_stage": "Benign | Reconnaissance | Initial Access | Execution | Persistence | Privilege Escalation | Lateral Movement | Command and Control | Exfiltration",
  "predicted_stage": "same stage enum",
  "risk_score": 0,
  "risk_level": "LOW | MEDIUM | HIGH | CRITICAL",
  "confidence": 0.0,
  "forecast_horizon": 5,
  "evidence": [],
  "top_features": [],
  "mitre": [],
  "model": "lstm | transformer | antcm | fallback",
  "model_version": "string"
}
```

## Model Input and Output Schemas

Model input:

```json
{
  "sequence_length": 10,
  "feature_count": 0,
  "states": [],
  "feature_matrix": [[0.0]],
  "graph_sequence": [],
  "horizon": 5,
  "model": "lstm | transformer | antcm"
}
```

Model output:

```json
{
  "timestamp": "ISO-8601 UTC",
  "current_risk": 0.0,
  "predicted_risk": 0.0,
  "predicted_stage": "Reconnaissance",
  "confidence": 0.0,
  "forecast": [
    {
      "step": 1,
      "risk": 0.0,
      "stage": "Benign",
      "confidence": 0.0
    }
  ],
  "evidence": [],
  "top_features": [],
  "model": "transformer",
  "model_version": "0.1.0"
}
```

## API Contract

Initial REST endpoints:

- `POST /api/ingest/upload`: upload CSV or PCAP, select dataset adapter, return ingestion job summary.
- `GET /api/features/{job_id}`: return extracted feature summary and data quality warnings.
- `POST /api/forecast`: accept state sequence or job id, run K-step forecast.
- `GET /api/forecast/latest`: return latest forecast result.
- `GET /api/forecast/timeline`: return forecast timeline for charts.
- `GET /api/alerts`: list alerts.
- `GET /api/alerts/{id}`: return one alert with evidence.
- `GET /api/network/graph`: return latest graph state.
- `GET /api/explainability/{id}`: return feature attribution, attention, and human evidence.
- `GET /api/models`: return model registry entries and whether weights are loaded.
- `GET /api/metrics`: return real evaluation metrics or `Not evaluated yet`.
- `GET /api/system/status`: return app, replay, model, and latency status.

## Attack Stage and MITRE Mapping

Use a simplified stage enum:

- `Benign`
- `Reconnaissance`
- `Initial Access`
- `Execution`
- `Persistence`
- `Privilege Escalation`
- `Lateral Movement`
- `Command and Control`
- `Exfiltration`

MITRE mapping is an estimate for analyst context, not proof of attacker intent.

## Risk Formula

Initial configurable formula:

```text
risk_score =
  35% future_attack_probability +
  20% current_anomaly_score +
  15% stage_severity +
  15% persistence_across_windows +
  10% suspicious_source_count +
   5% model_confidence
```

Levels:

- `0-29`: `LOW`
- `30-59`: `MEDIUM`
- `60-79`: `HIGH`
- `80-100`: `CRITICAL`

No risk result should be random. Demo-mode forecasts must be labelled as demo/fallback.

## Implementation Phases

1. Repository structure and contracts.
2. Dataset adapters for CIC-IDS2018, CTU-13, UNSW-NB15, generic CSV, and PCAP.
3. Feature extraction for flow, packet, temporal, reconnaissance, exfiltration, and optional DNS features.
4. Time-windowed `NetworkState` builder and fixed feature vector.
5. Baseline Logistic Regression and XGBoost training.
6. LSTM world model.
7. Lightweight Transformer world model.
8. Recursive K-step rollout.
9. MITRE ATT&CK stage mapper.
10. Explainability for baselines and temporal models.
11. Network graph enrichment and suspicious centrality.
12. FastAPI backend.
13. SOC dashboard.
14. Replay and streaming simulation.
15. Evaluation and benchmark scripts.
16. Tests.
17. Docker and local scripts.
18. Documentation.

## Immediate Next Implementation Work

Phase 2 has started with backend Pydantic schemas, dataset adapter wrappers, canonical state conversion, a local model registry entry for `ANTCM_trained_model.pkl`, and contract tests.

The ANTCM artifact is available, but it should not be treated as production-ready inference until its expected feature order and preprocessing artifacts are fully recovered from `antcm.ipynb` or a saved feature schema. Current registry metadata therefore reports metrics as `Not evaluated yet`.

Follow-up ANTCM recovery found that the pickle was created from notebook-local classes, references a missing `core` package, and stores CUDA tensors. Compatibility shims and CPU tensor remapping were added, but full deserialization is slow enough that model status must not load the artifact eagerly. Forecasting should load ANTCM only on explicit inference requests.

The notebook outputs confirm that ANTCM was trained as a CSE-CIC-IDS2018 CICFlowMeter static classifier using 77 base flow features plus 7 learned `kernel_feature_*` values. The reported notebook metrics are accuracy `0.9752`, weighted precision `0.9650`, weighted recall `0.9752`, weighted F1 `0.9692`, and false alarm rate `0.0023`. These are now captured in `configs/antcm_feature_schema.json`. They should be presented as notebook-reported metrics until re-evaluated locally.

Phase 3 has started with modular behavior and DNS feature extraction. The new feature layer calculates scan-like behavior, beacon regularity, outbound/inbound transfer signals, sequential/random port access, connection frequency, destination frequency, packet burst rate, and optional DNS query statistics. `build_canonical_states()` now uses these behavior features when states are created from normalized records.

Phase 3 was extended with dedicated flow-level and packet-level feature summaries plus a combined `FeatureBundle` facade. The backend now exposes `POST /api/features/extract` for local CSV/PCAP feature extraction through dataset adapters. The endpoint is intended for offline demo and upload workflows; it reports feature values and adapter warnings without claiming model performance.

Phase 4 has started with sequence contracts and sliding-window example creation. The backend can now convert chronological `NetworkState` objects into examples shaped as `S(t-n)..S(t) -> S(t+offset)`, with next-state vectors, attack probability, and inferred attack stage labels. `POST /api/sequences/create` exposes this path for local CSV/PCAP-backed demos.

Phase 4 now also supports sequence JSONL persistence, JSONL loading, NumPy array export for training, and a CLI smoke path: `python -m backend.training.create_sequences --input <file> --dataset "Generic CSV" --output data/processed/sequences.jsonl`.
