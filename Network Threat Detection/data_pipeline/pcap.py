"""Small dependency-free reader for classic Ethernet/IPv4 PCAP captures.

The reader intentionally supports classic .pcap only. PCAPNG, non-Ethernet captures,
IPv6 and tunneled traffic should be converted to a flow CSV or parsed by a future adapter.
"""

from __future__ import annotations

import ipaddress
import struct
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Iterator

import pandas as pd

from .flow import CANONICAL_COLUMNS


MAGIC_FORMATS = {
    b"\xd4\xc3\xb2\xa1": ("<", 1_000_000),
    b"\xa1\xb2\xc3\xd4": (">", 1_000_000),
    b"\x4d\x3c\xb2\xa1": ("<", 1_000_000_000),
    b"\xa1\xb2\x3c\x4d": (">", 1_000_000_000),
}
PROTOCOL_NAMES = {1: "ICMP", 6: "TCP", 17: "UDP"}


def _empty_record(timestamp: datetime, src_ip: str, dst_ip: str, protocol: str, byte_count: int) -> dict[str, Any]:
    return {
        "timestamp": timestamp,
        "src_ip": src_ip,
        "dst_ip": dst_ip,
        "src_port": pd.NA,
        "dst_port": pd.NA,
        "protocol": protocol,
        "packet_count": 1,
        "byte_count": byte_count,
        "syn_count": 0,
        "ack_count": 0,
        "fin_count": 0,
        "rst_count": 0,
        "psh_count": 0,
        "urg_count": 0,
        "iat_mean_ms": float("nan"),
        "iat_std_ms": float("nan"),
        "iat_max_ms": float("nan"),
        "ttl": float("nan"),
        "tcp_window_size": float("nan"),
        "retransmission_count": float("nan"),
        "fragment_count": 0,
        "label": pd.NA,
    }


def _ipv4_record(timestamp: datetime, packet: bytes, original_length: int) -> dict[str, Any] | None:
    if len(packet) < 14:
        return None
    ether_type = struct.unpack("!H", packet[12:14])[0]
    offset = 14
    while ether_type in {0x8100, 0x88A8}:
        if len(packet) < offset + 4:
            return None
        ether_type = struct.unpack("!H", packet[offset + 2 : offset + 4])[0]
        offset += 4
    if ether_type != 0x0800 or len(packet) < offset + 20:
        return None

    version_ihl = packet[offset]
    if version_ihl >> 4 != 4:
        return None
    ip_header_length = (version_ihl & 0x0F) * 4
    if ip_header_length < 20 or len(packet) < offset + ip_header_length:
        return None

    total_length = struct.unpack("!H", packet[offset + 2 : offset + 4])[0]
    flags_and_offset = struct.unpack("!H", packet[offset + 6 : offset + 8])[0]
    protocol_number = packet[offset + 9]
    src_ip = str(ipaddress.ip_address(packet[offset + 12 : offset + 16]))
    dst_ip = str(ipaddress.ip_address(packet[offset + 16 : offset + 20]))
    payload_offset = offset + ip_header_length
    protocol = PROTOCOL_NAMES.get(protocol_number, str(protocol_number))
    record = _empty_record(timestamp, src_ip, dst_ip, protocol, total_length or original_length)
    record["ttl"] = packet[offset + 8]
    record["fragment_count"] = int(bool((flags_and_offset & 0x1FFF) or (flags_and_offset & 0x2000)))

    if protocol_number in {6, 17} and len(packet) >= payload_offset + 4:
        record["src_port"], record["dst_port"] = struct.unpack("!HH", packet[payload_offset : payload_offset + 4])

    if protocol_number == 6 and len(packet) >= payload_offset + 20:
        flags = packet[payload_offset + 13]
        record.update(
            {
                "fin_count": int(bool(flags & 0x01)),
                "syn_count": int(bool(flags & 0x02)),
                "rst_count": int(bool(flags & 0x04)),
                "psh_count": int(bool(flags & 0x08)),
                "ack_count": int(bool(flags & 0x10)),
                "urg_count": int(bool(flags & 0x20)),
                "tcp_window_size": struct.unpack("!H", packet[payload_offset + 14 : payload_offset + 16])[0],
            }
        )
    return record


def _iter_classic_pcap_records(path: Path) -> Iterator[dict[str, Any]]:
    with path.open("rb") as stream:
        global_header = stream.read(24)
        if len(global_header) != 24:
            raise ValueError("PCAP file is missing a complete global header")
        magic = global_header[:4]
        if magic not in MAGIC_FORMATS:
            raise ValueError("Only classic .pcap captures are supported; PCAPNG is not supported by this adapter")
        byte_order, fraction_divisor = MAGIC_FORMATS[magic]
        network_type = struct.unpack(f"{byte_order}I", global_header[20:24])[0]
        if network_type != 1:
            raise ValueError("Only Ethernet-link PCAP captures are supported by this adapter")

        while header := stream.read(16):
            if len(header) != 16:
                raise ValueError("PCAP file ended during a packet header")
            seconds, fraction, included_length, original_length = struct.unpack(f"{byte_order}IIII", header)
            packet = stream.read(included_length)
            if len(packet) != included_length:
                raise ValueError("PCAP file ended during packet data")
            timestamp = datetime.fromtimestamp(seconds + fraction / fraction_divisor, tz=UTC)
            record = _ipv4_record(timestamp, packet, original_length)
            if record is not None:
                yield record


def read_classic_pcap(path: str | Path) -> pd.DataFrame:
    """Read a classic PCAP file into the canonical packet-record frame."""
    capture_path = Path(path)
    records = list(_iter_classic_pcap_records(capture_path))
    if not records:
        raise ValueError("No Ethernet/IPv4 packet records were found in the PCAP")
    return pd.DataFrame(records, columns=CANONICAL_COLUMNS)
