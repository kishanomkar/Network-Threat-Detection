# CTU-13 Scenario 1 input

This directory contains the **Scenario 1 / Neris botnet** packet capture from the
CTU-13 dataset, used as the project’s first real packet-level input for the
Person 1 pipeline.

| Field | Value |
| --- | --- |
| Source | CTU / Stratosphere IPS Scenario 1 public dataset page |
| Download URL | `https://mcfp.felk.cvut.cz/publicDatasets/CTU-Malware-Capture-Botnet-42/botnet-capture-20110810-neris.pcap` |
| Local file | `ctu13_scenario1_neris_botnet.pcap` |
| Downloaded | 2026-08-26 |
| Size | 58,266,506 bytes |
| SHA-256 | `b89cd5931f62d87ceff266568c97c6e36e56dd0330813cacadbc14a6c5576a36` |
| Capture format | Classic Ethernet PCAP, little-endian microsecond timestamps |

The file is an original packet capture and has no per-packet ground-truth
label. It is therefore used to validate real packet parsing, 10-second network
states, and communication graph construction. It is **not** used as a labelled
forecast-training split. A later labelled-flow milestone will provide the
ground-truth labels required for supervised forecasting evaluation.

Do not edit this capture. To verify its integrity after copying it, run:

```bash
shasum -a 256 data/raw/ctu13/ctu13_scenario1_neris_botnet.pcap
```
