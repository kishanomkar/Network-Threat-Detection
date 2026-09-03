# Person 1 Data Pipeline

This additive pipeline turns a timestamped flow CSV or a classic PCAP capture into ordered, 10-second network states and directed communication graphs. It does not read from or change the existing FastAPI application, frontend, models, notebooks or KDD CSVs.

## Supported inputs

- Timestamped flow CSV with a timestamp plus source/destination IP fields. Common CICFlowMeter-style and CTU-13 bidirectional-flow aliases are configured in `../configs/pipeline_config.json`. Source duration units are mapped explicitly there, so CTU-13 `Dur` seconds and CICFlowMeter `Flow Duration` microseconds are never confused.
- Classic Ethernet/IPv4 `.pcap` captures containing TCP, UDP or ICMP. PCAPNG, IPv6 and non-Ethernet captures are deliberately rejected with a clear error rather than parsed incorrectly.

## Run

From the project root, use the existing virtual environment:

```bash
./.venv/bin/python -m data_pipeline.cli \
  --input /path/to/flows.csv \
  --dataset CSE-CIC-IDS2018 \
  --scenario Friday-DDoS \
  --split train \
  --output-dir network_states
```

The command writes newly generated JSONL files and a manifest below the requested output directory. It never overwrites a source capture or the existing project datasets.

## Chronological labelled splits

For a labelled flow CSV, use the separate split mode rather than running the
same input three times:

```bash
./.venv/bin/python -m data_pipeline.cli \
  --input data/raw/ctu13/ctu13_scenario1_labeled_flows.binetflow \
  --dataset CTU-13 \
  --scenario scenario-1-neris \
  --chronological-splits \
  --output-dir network_states/ctu13_scenario1_labeled
```

This produces contiguous 70% train, 15% validation and 15% test state/graph
files. It also saves `preprocessing/state_preprocessor.joblib`, fitted only on
the earliest training states, and a feature-order metadata file. Validation and
test timestamps always occur after their preceding partition, preventing
future-traffic leakage.

## Outputs

- `*.network_states.jsonl`: one state per time window, matching `configs/network_state.schema.json`.
- `*.graph_states.jsonl`: one communication graph per state, matching `configs/graph_state.schema.json`.
- `*.manifest.json`: input SHA-256, processing parameters, counts and output paths for reproducibility.
- `preprocessing/state_preprocessor.joblib`: median-imputer and scaler fitted only on chronological training states when `--chronological-splits` is used.
- `preprocessing/state_preprocessor.metadata.json`: fixed numeric-vector feature order and training time range.

Every state is built only from records that occur inside that state window. Future labels and forecast targets are not included, preventing temporal leakage into Person 2's model input.

## Training-only preprocessing

`StatePreprocessor` median-imputes unavailable packet fields and standardises the fixed numeric state-vector order. Fit it only on chronologically earlier training states, then save it for Person 2 to reuse on validation, test and live states:

```python
from data_pipeline.preprocessing import StatePreprocessor

preprocessor = StatePreprocessor().fit(training_states)
preprocessor.save("network_states/state_preprocessor.joblib")
validation_vectors = preprocessor.transform(validation_states)
```

This keeps missing-source data explicit in the state JSON while giving the temporal model a stable numeric input vector plus missing-value indicators.
