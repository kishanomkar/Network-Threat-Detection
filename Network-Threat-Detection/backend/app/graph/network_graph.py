"""Build a network behaviour graph from observed traffic windows."""

from __future__ import annotations

from collections import Counter
from typing import Any

from backend.app.risk import calculate_risk_level
from backend.app.schemas import NetworkState


def build_network_behavior_graph(
    states: list[NetworkState],
    graph_sequence: list[dict[str, Any]],
) -> dict[str, object]:
    if not graph_sequence:
        return {"status": "NO_DATA", "message": "No graph windows available"}

    latest_state = states[-1] if states else None
    latest_graph = graph_sequence[-1]
    nodes = [_decorate_node(node, states) for node in latest_graph["nodes"]]
    edges = [_decorate_edge(edge) for edge in latest_graph["edges"]]

    return {
        "status": "success",
        "state_count": len(states),
        "graph_count": len(graph_sequence),
        "latest_state_id": latest_graph["state_id"],
        "timestamp": latest_graph["timestamp"],
        "window_seconds": latest_graph["window_seconds"],
        "summary": _summary(states, nodes, edges),
        "graph": {
            "nodes": nodes,
            "links": edges,
        },
        "graph_sequence": [
            {
                "state_id": graph["state_id"],
                "timestamp": graph["timestamp"],
                "window_seconds": graph["window_seconds"],
                "node_count": len(graph["nodes"]),
                "edge_count": len(graph["edges"]),
            }
            for graph in graph_sequence
        ],
        "latest_state": {
            "state_id": latest_state.state_id,
            "timestamp": latest_state.timestamp.isoformat(),
            "scan_score": latest_state.scan_score,
            "beacon_score": latest_state.beacon_score,
            "exfiltration_score": latest_state.exfiltration_score,
            "flow_count": latest_state.flow_count,
            "bytes_total": latest_state.bytes_total,
        }
        if latest_state
        else None,
    }


def _decorate_node(node: dict[str, Any], states: list[NetworkState]) -> dict[str, Any]:
    host_id = str(node["id"])
    importance = max(
        float(node.get("in_degree", 0)),
        float(node.get("out_degree", 0)),
        float(node.get("bytes_sent") or 0) / 5000.0,
        float(node.get("bytes_received") or 0) / 5000.0,
    )
    risk_score = max(0.05, min(1.0, importance / 8.0))
    if states:
        latest = states[-1]
        risk_score = max(risk_score, latest.scan_score, latest.beacon_score, latest.exfiltration_score)
    probability = risk_score
    risk_level = calculate_risk_level(int(round(risk_score * 100))).value
    return {
        "id": host_id,
        "name": node.get("ip_address", host_id),
        "type": "host",
        "modelName": "network-behaviour",
        "source": "graph_builder",
        "timestamp": node.get("timestamp"),
        "probability": probability,
        "risk": risk_level,
        "record": node,
    }


def _decorate_edge(edge: dict[str, Any]) -> dict[str, Any]:
    packet_count = float(edge.get("packet_count") or 0)
    byte_count = float(edge.get("byte_count") or 0)
    flow_count = float(edge.get("flow_count") or 0)
    confidence = min(1.0, (packet_count / 50.0) + (flow_count / 20.0) + (byte_count / 20000.0))
    return {
        "source": edge["source"],
        "target": edge["target"],
        "label": "communicates",
        "confidence": round(confidence, 4),
        "timestamp": edge.get("timestamp"),
        "record": edge,
    }


def _summary(states: list[NetworkState], nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> dict[str, object]:
    risk_counts = Counter(node["risk"] for node in nodes)
    top_nodes = sorted(nodes, key=lambda node: (node.get("probability", 0), node.get("name", "")), reverse=True)[:5]
    top_edges = sorted(edges, key=lambda edge: edge.get("confidence", 0), reverse=True)[:5]
    return {
        "state_count": len(states),
        "node_count": len(nodes),
        "edge_count": len(edges),
        "high_risk_nodes": risk_counts.get("HIGH", 0),
        "critical_nodes": risk_counts.get("CRITICAL", 0),
        "top_nodes": top_nodes,
        "top_edges": top_edges,
    }
