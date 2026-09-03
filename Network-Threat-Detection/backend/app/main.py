"""FastAPI entry point for the SIH forecasting backend."""

from __future__ import annotations

import time
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes_analyze import router as analyze_router
from backend.app.api.routes_current import router as current_router
from backend.app.api.routes_explain import router as explain_router
from backend.app.api.routes_features import router as features_router
from backend.app.api.routes_forecast import router as forecast_router
from backend.app.api.routes_graph import router as graph_router
from backend.app.api.routes_investigation import router as investigation_router
from backend.app.api.routes_models import router as models_router
from backend.app.api.routes_risk import router as risk_router
from backend.app.api.routes_sequences import router as sequences_router
from backend.app.api.routes_timeline import router as timeline_router
from backend.app.models import ModelRegistry


app = FastAPI(
    title="AI Network Attack Forecasting API",
    version="0.2.0",
    description="Offline network-state forecasting backend for SOC demonstrations.",
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
START_TIME = time.monotonic()
model_registry = ModelRegistry(PROJECT_ROOT)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:5174",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(current_router)
app.include_router(explain_router)
app.include_router(risk_router)
app.include_router(models_router)
app.include_router(features_router)
app.include_router(forecast_router)
app.include_router(graph_router)
app.include_router(investigation_router)
app.include_router(sequences_router)
app.include_router(timeline_router)


@app.get("/")
def root() -> dict[str, object]:
    return {
        "status": "healthy",
        "application": "AI Network Attack Forecasting API",
        "name": "AI Network Attack Forecasting API",
        "version": app.version,
        "docs": "/docs",
        "available_endpoints": [
            "/health",
            "/api/system/status",
            "/api/project/overview",
            "/api/models",
            "/api/models/antcm/status",
            "/api/threats/current",
            "/api/explain/why",
            "/api/risk/score",
            "/api/features/extract",
            "/api/sequences/create",
            "/api/forecast",
            "/api/forecast/file",
            "/api/graph/network",
            "/api/investigate/case",
            "/api/timeline/progression",
            "/api/analyze",
        ],
    }


@app.get("/health")
def health() -> dict[str, object]:
    models = model_registry.list_models()
    loaded_models = [model["name"] for model in models if model["available"]]
    return {
        "status": "healthy",
        "total_loaded_models": len(loaded_models),
        "loaded_models": loaded_models,
        "available_models": models,
        "uptime_seconds": int(time.monotonic() - START_TIME),
    }


@app.get("/api/system/status")
def system_status() -> dict[str, object]:
    return {"status": "healthy", "mode": "sih-mvp", "uptime_seconds": int(time.monotonic() - START_TIME)}


@app.get("/api/project/overview")
def project_overview() -> dict[str, object]:
    return {
        "title": "AI Network Attack Forecasting",
        "goal": "Convert traffic captures into network states, detect suspicious behavior, and forecast how attack risk may evolve.",
        "demo_dataset": "CTU-13 Neris botnet PCAP sample",
        "person_role": "Person 2: model integration, temporal sequences, risk forecasting, explainability, and SIH demo dashboard.",
        "pipeline": [
            {
                "name": "Data Pipeline",
                "owner": "Person 1",
                "folder": "data_pipeline",
                "use": "Reads CSV/PCAP network traffic and normalizes packets or flows into a consistent table.",
                "feeds": "Network state builder",
            },
            {
                "name": "Network States",
                "owner": "Person 1 + Person 2 integration",
                "folder": "network_states / backend.app.state",
                "use": "Groups traffic into time windows with counts, bytes, scan signals, beacon signals, and exfiltration signals.",
                "feeds": "Temporal sequence builder and forecasting model",
            },
            {
                "name": "Graph Builder",
                "owner": "Person 1",
                "folder": "graph_builder",
                "use": "Builds host-to-host communication graphs so the team can explain which machines talked to each other.",
                "feeds": "SOC visualization and investigation view",
            },
            {
                "name": "Threat Investigation",
                "owner": "Person 2",
                "folder": "backend.app.investigation / frontend network page",
                "use": "Combines detection, forecast, timeline, and graph evidence into an analyst case file.",
                "feeds": "Analyst triage and response workflow",
            },
            {
                "name": "Network Behaviour Graph",
                "owner": "Person 2 integration",
                "folder": "backend.app.graph / frontend network page",
                "use": "Turns Person 1 graph windows into a visual host communication map with node and edge risk summaries.",
                "feeds": "Graph workspace and threat investigation workflow",
            },
            {
                "name": "ANTCM Model",
                "owner": "Person 2",
                "folder": "ANTCM_trained_model.pkl / backend.app.models",
                "use": "High-accuracy pretrained classifier metadata and compatibility layer from the notebook-trained CICIDS model.",
                "feeds": "Baseline model registry and future model ensemble",
            },
            {
                "name": "Temporal Forecasting",
                "owner": "Person 2",
                "folder": "backend.training / backend.app.forecasting",
                "use": "Creates ordered sequences and forecasts future risk for the next traffic windows.",
                "feeds": "Future risk card, forecast timeline, and SIH MVP dashboard",
            },
            {
                "name": "Attack Progression Timeline",
                "owner": "Person 2",
                "folder": "backend.app.timeline / frontend network page",
                "use": "Combines observed traffic windows with predicted future steps into one attack progression story.",
                "feeds": "Timeline view and threat investigation workflow",
            },
            {
                "name": "Current Threat Detection",
                "owner": "Person 2",
                "folder": "backend.app.detection / frontend network page",
                "use": "Detects the current attack status from the latest network state before forecasting future behavior.",
                "feeds": "Risk card, evidence panel, and investigation workflow",
            },
            {
                "name": "Frontend Dashboard",
                "owner": "Person 2 demo integration",
                "folder": "frontend",
                "use": "Shows current status, future risk, stage prediction, evidence, health, and model availability.",
                "feeds": "Internal-round presentation",
            },
        ],
    }
