from __future__ import annotations

import ipaddress
import json
import struct
import tempfile
import unittest
from pathlib import Path

import pandas as pd

from data_pipeline.config import load_pipeline_config
from data_pipeline.flow import normalise_flow_frame
from data_pipeline.pcap import read_classic_pcap
from data_pipeline.pipeline import run_chronological_split_pipeline, run_pipeline
from data_pipeline.preprocessing import STATE_VECTOR_PATHS, StatePreprocessor
from data_pipeline.states import iter_windowed_states
from graph_builder import build_graph_state


class PersonOnePipelineTests(unittest.TestCase):
    @staticmethod
    def fixture_flows() -> pd.DataFrame:
        return pd.DataFrame(
            [
                {
                    "Timestamp": "2026-08-26T10:00:01Z",
                    "Source IP": "10.0.0.4",
                    "Destination IP": "10.0.0.8",
                    "Source Port": 50000,
                    "Destination Port": 443,
                    "Protocol": "TCP",
                    "Total Fwd Packets": 4,
                    "Total Backward Packets": 2,
                    "Total Length of Fwd Packets": 400,
                    "Total Length of Bwd Packets": 200,
                    "SYN Flag Count": 1,
                    "ACK Flag Count": 2,
                    "Flow IAT Mean": 3.0,
                    "Flow IAT Std": 1.0,
                    "Flow IAT Max": 6.0,
                    "Flow Duration": 8_000,
                    "Label": "BENIGN",
                },
                {
                    "Timestamp": "2026-08-26T10:00:05Z",
                    "Source IP": "10.0.0.4",
                    "Destination IP": "10.0.0.20",
                    "Source Port": 50001,
                    "Destination Port": 22,
                    "Protocol": "TCP",
                    "Total Fwd Packets": 1,
                    "Total Backward Packets": 1,
                    "Total Length of Fwd Packets": 60,
                    "Total Length of Bwd Packets": 60,
                    "SYN Flag Count": 1,
                    "ACK Flag Count": 0,
                    "Flow IAT Mean": 5.0,
                    "Flow IAT Std": 2.0,
                    "Flow IAT Max": 8.0,
                    "Flow Duration": 6_000,
                    "Label": "ATTACK",
                },
                {
                    "Timestamp": "2026-08-26T10:00:12Z",
                    "Source IP": "10.0.0.8",
                    "Destination IP": "10.0.0.4",
                    "Source Port": 443,
                    "Destination Port": 50000,
                    "Protocol": "TCP",
                    "Total Fwd Packets": 2,
                    "Total Backward Packets": 3,
                    "Total Length of Fwd Packets": 120,
                    "Total Length of Bwd Packets": 300,
                    "SYN Flag Count": 0,
                    "ACK Flag Count": 2,
                    "Flow IAT Mean": 2.0,
                    "Flow IAT Std": 1.0,
                    "Flow IAT Max": 4.0,
                    "Flow Duration": 4_000,
                    "Label": "ATTACK",
                },
            ]
        )

    def test_flow_csv_creates_ordered_states_and_graphs(self) -> None:
        records = normalise_flow_frame(self.fixture_flows(), load_pipeline_config())
        windows = list(
            iter_windowed_states(
                records,
                window_seconds=10,
                dataset="fixture",
                scenario="scenario-a",
                capture_id="capture-a",
                split="train",
            )
        )
        self.assertEqual(len(windows), 2)
        first_state, first_records = windows[0]
        self.assertEqual(first_state["timestamp"], "2026-08-26T10:00:00Z")
        self.assertEqual(first_state["traffic_features"]["packet_count"], 8.0)
        self.assertEqual(first_state["traffic_features"]["byte_count"], 720.0)
        self.assertEqual(first_state["traffic_features"]["port_fanout"], 2)
        self.assertEqual(first_state["traffic_features"]["timing"]["mean_flow_duration_ms"], 7.0)
        self.assertEqual(first_state["ground_truth"]["current_label"], "MIXED")
        graph = build_graph_state(first_state, first_records)
        self.assertEqual(len(graph["nodes"]), 3)
        self.assertEqual(len(graph["edges"]), 2)
        self.assertEqual(graph["state_id"], first_state["state_id"])

    def test_pipeline_writes_reproducible_artifacts(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            input_path = root / "flows.csv"
            output_dir = root / "outputs"
            self.fixture_flows().to_csv(input_path, index=False)
            manifest = run_pipeline(
                input_path,
                output_dir,
                dataset="fixture",
                scenario="scenario-a",
                split="train",
            )
            state_path = Path(manifest["outputs"]["network_states"])
            graph_path = Path(manifest["outputs"]["graph_states"])
            manifest_path = Path(manifest["outputs"]["manifest"])
            self.assertTrue(state_path.is_file())
            self.assertTrue(graph_path.is_file())
            self.assertTrue(manifest_path.is_file())
            states = [json.loads(line) for line in state_path.read_text().splitlines()]
            self.assertEqual(len(states), 2)
            self.assertEqual(json.loads(manifest_path.read_text())["input"]["record_count"], 3)

    def test_ctu13_aliases_preserve_labels_and_duration_units(self) -> None:
        ctu13 = pd.DataFrame(
            [
                {
                    "StartTime": "2011/08/10 09:46:53.047277",
                    "Dur": 1.5,
                    "Proto": "udp",
                    "SrcAddr": "147.32.84.165",
                    "Sport": 40000,
                    "DstAddr": "8.8.8.8",
                    "Dport": 53,
                    "TotPkts": 12,
                    "TotBytes": 875,
                    "Label": "flow=From-Botnet-V42-UDP-DNS",
                }
            ]
        )
        record = normalise_flow_frame(ctu13, load_pipeline_config()).iloc[0]
        self.assertEqual(record["src_ip"], "147.32.84.165")
        self.assertEqual(record["protocol"], "UDP")
        self.assertEqual(record["packet_count"], 12)
        self.assertEqual(record["flow_duration_ms"], 1500.0)
        self.assertEqual(record["label"], "flow=From-Botnet-V42-UDP-DNS")

    def test_chronological_split_pipeline_keeps_preprocessing_train_only(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            input_path = root / "flows.csv"
            output_dir = root / "outputs"
            flows = self.fixture_flows()
            extra = flows.iloc[-1].copy()
            extra["Timestamp"] = "2026-08-26T10:00:22Z"
            extra["Label"] = "BENIGN"
            pd.concat([flows, pd.DataFrame([extra])], ignore_index=True).to_csv(input_path, index=False)

            manifest = run_chronological_split_pipeline(
                input_path,
                output_dir,
                dataset="fixture",
                scenario="scenario-a",
            )

            self.assertEqual(sum(split["state_count"] for split in manifest["splits"].values()), 3)
            self.assertEqual(manifest["preprocessing"]["fitted_on_split"], "train")
            self.assertTrue(Path(manifest["preprocessing"]["artifact"]).is_file())
            train_states = [
                json.loads(line)
                for line in Path(manifest["splits"]["train"]["network_states"]).read_text().splitlines()
            ]
            validation_states = [
                json.loads(line)
                for line in Path(manifest["splits"]["validation"]["network_states"]).read_text().splitlines()
            ]
            self.assertEqual(train_states[0]["source"]["split"], "train")
            self.assertEqual(validation_states[0]["source"]["split"], "validation")
            self.assertLess(train_states[-1]["timestamp"], validation_states[0]["timestamp"])
            loaded = StatePreprocessor.load(manifest["preprocessing"]["artifact"])
            self.assertEqual(loaded.transform(validation_states).shape[0], len(validation_states))

    def test_preprocessor_uses_training_states_only_and_tracks_missing_values(self) -> None:
        records = normalise_flow_frame(self.fixture_flows(), load_pipeline_config())
        states = [state for state, _ in iter_windowed_states(
            records,
            window_seconds=10,
            dataset="fixture",
            scenario="scenario-a",
            capture_id="capture-a",
            split="train",
        )]
        preprocessor = StatePreprocessor().fit(states[:1])
        vectors = preprocessor.transform(states[1:])
        self.assertEqual(vectors.shape[0], 1)
        self.assertGreaterEqual(vectors.shape[1], len(STATE_VECTOR_PATHS))
        self.assertEqual(preprocessor.metadata()["input_features"], list(STATE_VECTOR_PATHS))

    def test_classic_pcap_reader_extracts_tcp_metadata(self) -> None:
        ethernet = b"\xaa" * 6 + b"\xbb" * 6 + b"\x08\x00"
        source = ipaddress.ip_address("192.0.2.10").packed
        destination = ipaddress.ip_address("198.51.100.20").packed
        ip_header = struct.pack("!BBHHHBBH4s4s", 0x45, 0, 40, 1, 0, 64, 6, 0, source, destination)
        tcp_header = struct.pack("!HHLLBBHHH", 50000, 443, 1, 0, 0x50, 0x02, 4096, 0, 0)
        packet = ethernet + ip_header + tcp_header
        global_header = struct.pack("<IHHIIII", 0xA1B2C3D4, 2, 4, 0, 0, 65535, 1)
        record_header = struct.pack("<IIII", 1_700_000_000, 0, len(packet), len(packet))
        with tempfile.TemporaryDirectory() as temporary_directory:
            capture_path = Path(temporary_directory) / "fixture.pcap"
            capture_path.write_bytes(global_header + record_header + packet)
            records = read_classic_pcap(capture_path)
        self.assertEqual(len(records), 1)
        self.assertEqual(records.iloc[0]["src_ip"], "192.0.2.10")
        self.assertEqual(records.iloc[0]["dst_port"], 443)
        self.assertEqual(records.iloc[0]["syn_count"], 1)
        self.assertEqual(records.iloc[0]["tcp_window_size"], 4096)


if __name__ == "__main__":
    unittest.main()
