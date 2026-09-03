# SIH Internal Round MVP Plan

## Current Architecture

The repository now has a practical MVP backend path:

```text
CSV traffic
  -> dataset adapter
  -> normalized flow records
  -> feature extraction
  -> time-windowed NetworkState objects
  -> sequence examples
  -> current stage/risk estimate
  -> temporal fallback forecast
  -> risk score + explanation
  -> FastAPI response
```

Existing frontend is still the older multi-model dashboard. It needs a focused SIH dashboard screen that calls `/api/analyze`.

## Already Implemented

- CSV ingestion through `Generic CSV`, `CIC-IDS2018`, `CTU-13`, `UNSW-NB15`, and `PCAP` adapters.
- Canonical `NetworkState`, `ModelOutput`, `Alert`, and sequence schemas.
- Flow, packet, behavior, and optional DNS feature extraction.
- Time-windowed state creation using 10-second default windows.
- Sequence generation: `S(t-n)..S(t) -> S(t+offset)`.
- Sequence save/load and NumPy export for training.
- ANTCM static model schema recovered from notebook outputs.
- High-level MVP endpoint: `POST /api/analyze`.
- FastAPI routes for features, sequences, model status, and forecast.
- Tests for Person 1 pipeline, Phase 2 contracts, Phase 3 features, Phase 4 sequences, and MVP analyze path.

## Missing For A Strong Internal Round Showcase

Must complete:

- A simple LSTM world model that trains on sequence examples.
- Save/load for the LSTM model.
- `/api/analyze` should use the trained LSTM when available and fall back only when not trained.
- Risk score should use LSTM future probability when the LSTM is loaded.
- A dashboard screen that clearly shows current vs future risk.
- Demo CSV generator/replay mode that progressively reveals normal -> reconnaissance -> initial access -> lateral movement/C2.
- Basic metrics page or endpoint using actual generated/test data.

Can wait:

- Transformer.
- GNN.
- Advanced PCAP engine.
- Multi-dataset benchmarking.
- SHAP for LSTM.
- Complex 3D graph visualization.
- Docker polish.

## Recommended Implementation Order

1. Finish MVP backend `/api/analyze` path.
2. Create synthetic SIH demo CSV generator.
3. Implement LSTM world model using existing sequence arrays.
4. Add train/evaluate script for LSTM.
5. Update `/api/analyze` to use LSTM when weights exist.
6. Build a focused dashboard page around `/api/analyze`.
7. Add demo replay controls and risk timeline.
8. Add basic evaluation metrics from real generated/test sequences.

## Showcase Target

For the internal round, complete through:

- Phase 1 repository/contracts.
- Phase 2 adapters and schemas.
- Phase 3 feature extraction.
- Phase 4 sequence creation.
- MVP version of Phase 6 LSTM world model.
- MVP version of risk/explanation.
- MVP dashboard and replay mode.

This is enough to demonstrate the core idea:

```text
Traditional IDS: "This traffic looks malicious now."
Our system: "The network is moving toward a risky stage, and future risk is increasing."
```
