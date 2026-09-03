import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ArrowRight, Brain, Clock3, Crosshair, FileSearch, FileScan, Gauge, Network, PlayCircle, Radar, Route, ShieldAlert, ArrowDown, ArrowUp, Activity } from "lucide-react";
import FraudGraph3D from "../components/FraudGraph3D.jsx";
import PageShell from "../components/PageShell.jsx";
import Loader from "../components/Loader.jsx";
import { buildAttackTimeline, buildInvestigationCase, buildNetworkGraph, detectCurrentThreat, explainPrediction, forecastNetworkTraffic, getHealth, assessThreatRisk } from "../services/api.js";

const DEMO_PATH = "data/raw/ctu13/ctu13_scenario1_neris_botnet.pcap";

const toneMap = {
  NORMAL: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-900",
  SUSPICIOUS: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-900",
  ATTACK: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-900",
};

const projectFlow = [
  { label: "Person 1", title: "PCAP/CSV input", detail: "data_pipeline reads traffic" },
  { label: "Shared", title: "Network states", detail: "10-second behavior windows" },
  { label: "Person 2", title: "Model layer", detail: "ANTCM baseline + temporal forecast" },
  { label: "Demo", title: "SIH dashboard", detail: "risk, stage, evidence" },
];

const featureActions = [
  {
    id: "feature-1-current",
    label: "Feature 1",
    title: "Current Threat Detection",
    endpoint: "POST /api/threats/current",
    accent: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  },
  {
    id: "feature-2-forecast",
    label: "Feature 2",
    title: "Future Attack Forecasting",
    endpoint: "POST /api/forecast/file",
    accent: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
  },
  {
    id: "feature-3-timeline",
    label: "Feature 3",
    title: "Attack Progression Timeline",
    endpoint: "POST /api/timeline/progression",
    accent: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  },
  {
    id: "feature-4-graph",
    label: "Feature 4",
    title: "Network Behaviour Graph",
    endpoint: "POST /api/graph/network",
    accent: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-200",
  },
  {
    id: "feature-5-investigation",
    label: "Feature 5",
    title: "Threat Investigation",
    endpoint: "POST /api/investigate/case",
    accent: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
  },
  {
    id: "feature-6-explain",
    label: "Feature 6",
    title: "Explainable AI",
    endpoint: "POST /api/explain/why",
    accent: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200",
  },
  {
    id: "feature-7-risk",
    label: "Feature 7",
    title: "Threat Risk Scoring",
    endpoint: "POST /api/risk/assessment",
    accent: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200",
  },
];

const NetworkIntrusion = () => {
  const [path, setPath] = useState(DEMO_PATH);
  const [currentThreat, setCurrentThreat] = useState(null);
  const [result, setResult] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [networkGraph, setNetworkGraph] = useState(null);
  const [investigation, setInvestigation] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [riskScore, setRiskScore] = useState(null);
  const [selectedGraphNode, setSelectedGraphNode] = useState(null);
  const [health, setHealth] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [forecasting, setForecasting] = useState(false);
  const [buildingTimeline, setBuildingTimeline] = useState(false);
  const [buildingGraph, setBuildingGraph] = useState(false);
  const [investigating, setInvestigating] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState("");

  const activeThreat = currentThreat || result;
  const currentTone = useMemo(() => toneMap[activeThreat?.current_status || "NORMAL"], [activeThreat]);

  useEffect(() => {
    const loadHealth = async () => {
      try {
        setHealth(await getHealth());
      } catch {
        setHealth(null);
      }
    };
    loadHealth();
  }, []);

  const requestPayload = {
    path,
    dataset: "PCAP",
    scenario: "sih-internal-round",
    capture_id: "demo-capture",
    window_seconds: 10,
    max_records: 1000,
  };

  const runCurrentDetection = async () => {
    setDetecting(true);
    setError("");
    try {
      const response = await detectCurrentThreat(requestPayload);
      setCurrentThreat(response);
      toast.success("Current threat detected");
    } catch (apiError) {
      const message = apiError.message || "Current threat detection failed";
      setError(message);
      toast.error("Could not detect current threat");
    } finally {
      setDetecting(false);
    }
  };

  const runAnalysis = async () => {
    setForecasting(true);
    setError("");
    try {
      const response = await forecastNetworkTraffic({
        ...requestPayload,
        sequence_length: 5,
        horizon: 5,
      });
      setResult(response);
      setCurrentThreat(response);
      toast.success("Network analysis ready");
    } catch (apiError) {
      const message = apiError.message || "Analysis failed";
      setError(message);
      toast.error("Could not run analysis");
    } finally {
      setForecasting(false);
    }
  };

  const runTimeline = async () => {
    setBuildingTimeline(true);
    setError("");
    try {
      const response = await buildAttackTimeline({
        ...requestPayload,
        sequence_length: 5,
        horizon: 5,
        observed_limit: 10,
      });
      setTimeline(response);
      toast.success("Attack timeline ready");
    } catch (apiError) {
      const message = apiError.message || "Timeline generation failed";
      setError(message);
      toast.error("Could not build timeline");
    } finally {
      setBuildingTimeline(false);
    }
  };

  const runGraph = async () => {
    setBuildingGraph(true);
    setError("");
    try {
      const response = await buildNetworkGraph({
        ...requestPayload,
        graph_limit: 5,
      });
      setNetworkGraph(response);
      toast.success("Network graph ready");
    } catch (apiError) {
      const message = apiError.message || "Network graph generation failed";
      setError(message);
      toast.error("Could not build network graph");
    } finally {
      setBuildingGraph(false);
    }
  };

  const runInvestigation = async () => {
    setInvestigating(true);
    setError("");
    try {
      setInvestigation(await buildInvestigationCase({ ...requestPayload, max_records: 250, sequence_length: 4, horizon: 3 }));
      toast.success("Investigation case ready");
    } catch (apiError) {
      setError(apiError.message || "Investigation failed");
      toast.error("Could not build investigation");
    } finally {
      setInvestigating(false);
    }
  };

  const runExplanation = async () => {
    setExplaining(true);
    setError("");
    try {
      setExplanation(await explainPrediction({ ...requestPayload, max_records: 400 }));
      toast.success("Explanation ready");
    } catch (apiError) {
      setError(apiError.message || "Explanation failed");
      toast.error("Could not explain prediction");
    } finally {
      setExplaining(false);
    }
  };

  const runRiskScore = async () => {
    setScoring(true);
    setError("");
    try {
      setRiskScore(await assessThreatRisk({ ...requestPayload, max_records: 400 }));
      toast.success("Risk assessment ready");
    } catch (apiError) {
      setError(apiError.message || "Risk scoring failed");
      toast.error("Could not score risk");
    } finally {
      setScoring(false);
    }
  };

  const busy = detecting || forecasting || buildingTimeline || buildingGraph || investigating || explaining || scoring;

  return (
    <PageShell>
      <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-200">
              <Radar className="h-4 w-4" />
              SIH internal round network threat forecasting
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white md:text-5xl">
              Live attack forecasting console
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Run the demo capture through the backend analyzer and show the current state, predicted future risk, attack stage, and evidence in one screen.
            </p>
            <label className="mt-6 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Capture path
            </label>
            <input
              value={path}
              onChange={(event) => setPath(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none ring-0 transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={runCurrentDetection} className="btn-primary" disabled={busy || !path.trim()}>
                <Crosshair className="h-4 w-4" />
                {detecting ? "Detecting..." : "Detect Current Threat"}
              </button>
              <button onClick={runAnalysis} className="btn-secondary" disabled={busy || !path.trim()}>
                <PlayCircle className="h-4 w-4" />
                {forecasting ? "Forecasting..." : "Run Forecast"}
              </button>
              <button onClick={runTimeline} className="btn-secondary" disabled={busy || !path.trim()}>
                <Route className="h-4 w-4" />
                {buildingTimeline ? "Building..." : "Build Timeline"}
              </button>
              <button onClick={runGraph} className="btn-secondary" disabled={busy || !path.trim()}>
                <Network className="h-4 w-4" />
                {buildingGraph ? "Mapping..." : "Build Graph"}
              </button>
              <button onClick={runInvestigation} className="btn-secondary" disabled={busy || !path.trim()}>
                <FileSearch className="h-4 w-4" />
                {investigating ? "Investigating..." : "Build Case"}
              </button>
              <button onClick={runExplanation} className="btn-secondary" disabled={busy || !path.trim()}>
                <Brain className="h-4 w-4" />
                {explaining ? "Explaining..." : "Explain Why"}
              </button>
              <button onClick={runRiskScore} className="btn-secondary" disabled={busy || !path.trim()}>
                <Gauge className="h-4 w-4" />
                {scoring ? "Scoring..." : "Score Risk"}
              </button>
              <a href="#project-flow" className="btn-secondary">
                Project flow
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#results" className="btn-secondary">
                View results
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {featureActions.map((feature) => (
                <div key={feature.id} className={`rounded-xl border p-4 ${feature.accent}`}>
                  <div className="text-xs font-semibold uppercase tracking-wide opacity-80">{feature.label}</div>
                  <div className="mt-2 text-sm font-bold">{feature.title}</div>
                  <div className="mt-1 font-mono text-xs opacity-80">{feature.endpoint}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className={`rounded-2xl border p-5 ${currentTone || toneMap.NORMAL}`}>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                <ShieldAlert className="h-4 w-4" />
                Current status
              </div>
              <div className="mt-3 text-4xl font-bold">{activeThreat?.current_status || "READY"}</div>
              <div className="mt-2 text-sm opacity-90">
                {activeThreat ? `Attack: ${activeThreat.current_attack}` : "Load the demo capture to see the live status."}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <StatCard icon={Brain} label="Current risk" value={activeThreat ? `${activeThreat.current_risk}%` : "--"} />
              <StatCard icon={Clock3} label="Future risk" value={result ? `${result.future_risk}%` : "--"} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <FileScan className="h-4 w-4" />
                Backend readiness
              </div>
              <div className="mt-3 grid gap-3 text-sm text-slate-600 dark:text-slate-300">
                <div>Status: <span className="font-semibold text-slate-950 dark:text-white">{health?.status || "checking"}</span></div>
                <div>Loaded models: <span className="font-semibold text-slate-950 dark:text-white">{health?.loaded_models?.join(", ") || "none yet"}</span></div>
                <div>Dataset: <span className="font-semibold text-slate-950 dark:text-white">CTU-13 botnet capture</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="project-flow" className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {projectFlow.map((item, index) => (
          <div key={item.title} className="panel p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                {item.label}
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-300">0{index + 1}</span>
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-950 dark:text-white">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.detail}</p>
          </div>
        ))}
      </section>

      {busy && (
        <div className="panel p-5">
          <Loader
            label={
              detecting
                ? "Detecting current threat..."
                : buildingTimeline
                  ? "Building attack progression timeline..."
                  : buildingGraph
                    ? "Building network behaviour graph..."
                    : investigating
                      ? "Building investigation case..."
                      : explaining
                        ? "Computing feature attributions..."
                        : scoring
                          ? "Scoring threat risk..."
                  : "Forecasting attack progression..."
            }
          />
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
          {error}
        </div>
      )}

      <FeatureShell
        accent="emerald"
        title="Feature 1: Current Threat Detection"
        subtitle="Present-time classification from the latest network state"
        empty={!currentThreat}
        emptyText="Click Detect Current Threat to fill this feature area."
      >
        {currentThreat && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <div className="grid gap-4 md:grid-cols-4">
                <MiniStat label="Status" value={currentThreat.current_status} />
                <MiniStat label="Attack" value={currentThreat.current_attack} />
                <MiniStat label="Risk" value={`${currentThreat.current_risk}%`} />
                <MiniStat label="Confidence" value={`${currentThreat.confidence}%`} />
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <SignalBar label="Scan" value={currentThreat.latest_state?.scan_score} color="emerald" />
                <SignalBar label="Beacon" value={currentThreat.latest_state?.beacon_score} color="emerald" />
                <SignalBar label="Exfiltration" value={currentThreat.latest_state?.exfiltration_score} color="emerald" />
              </div>
            </div>
            <EvidenceList title="Current evidence" items={currentThreat.evidence} />
          </div>
        )}
      </FeatureShell>

      <FeatureShell
        accent="blue"
        title="Feature 2: Future Attack Forecasting"
        subtitle="Predicted risk and attack stage for upcoming traffic windows"
        empty={!result}
        emptyText="Click Run Forecast to fill this feature area."
      >
        {result && (
          <div id="results" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MiniStat label="Predicted stage" value={result.predicted_stage} />
                <MiniStat label="Future risk" value={`${result.future_risk}%`} />
                <MiniStat label="Confidence" value={`${result.confidence}%`} />
                <MiniStat label="Model" value={`${result.model} ${result.model_version || ""}`.trim()} />
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-5">
                {(result.timeline || []).map((step, index) => (
                  <ForecastStepCard key={`${step.step}-${index}`} step={step} />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <FeatureList title="Forecast signals" items={result.top_features} />
              <EvidenceList title="Forecast evidence" items={result.evidence || result.explanations} />
            </div>
          </div>
        )}
      </FeatureShell>

      <FeatureShell
        accent="amber"
        title="Feature 3: Attack Progression Timeline"
        subtitle="Observed network windows separated from forecasted future steps"
        empty={!timeline}
        emptyText="Click Build Timeline to fill this feature area."
      >
        {timeline && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <MiniStat label="Observed windows" value={timeline.observed_count} />
              <MiniStat label="Predicted steps" value={timeline.predicted_count} />
              <MiniStat label="Model" value={timeline.model} />
            </div>
            <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              {(timeline.stage_path || []).join(" -> ")}
            </div>
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <TimelineLane title="Observed progression" events={(timeline.timeline || []).filter((event) => event.kind === "observed")} />
              <TimelineLane title="Predicted progression" events={(timeline.timeline || []).filter((event) => event.kind === "predicted")} predicted />
            </div>
          </>
        )}
      </FeatureShell>

      <FeatureShell
        accent="cyan"
        title="Feature 4: Network Behaviour Graph"
        subtitle="Host-to-host communication map built from real traffic windows"
        empty={!networkGraph}
        emptyText="Click Build Graph to fill this feature area."
      >
        {networkGraph && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <FraudGraph3D
              graphData={networkGraph.graph}
              onNodeSelect={setSelectedGraphNode}
              title="3D Network Behaviour Graph"
              subtitle="Rotate, zoom, and click hosts to inspect communication behavior."
            />
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <MiniStat label="Hosts" value={networkGraph.summary?.node_count || 0} />
                <MiniStat label="Connections" value={networkGraph.summary?.edge_count || 0} />
                <MiniStat label="Graph windows" value={networkGraph.graph_count || 0} />
                <MiniStat label="Source" value={networkGraph.source_kind} />
              </div>
              <FeatureList title="Top hosts" items={(networkGraph.summary?.top_nodes || []).map((node) => node.name)} />
              <FeatureList
                title="Top connections"
                items={(networkGraph.summary?.top_edges || []).map((edge) => `${edge.source} -> ${edge.target}`)}
              />
              {selectedGraphNode && (
                <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-900 dark:bg-cyan-950/40">
                  <h3 className="text-sm font-bold text-cyan-900 dark:text-cyan-100">Selected host</h3>
                  <div className="mt-3 space-y-2 text-sm text-cyan-900 dark:text-cyan-100">
                    <div>Name: <span className="font-semibold">{selectedGraphNode.name || selectedGraphNode.id}</span></div>
                    <div>Risk: <span className="font-semibold">{selectedGraphNode.risk || "N/A"}</span></div>
                    <div>Score: <span className="font-semibold">{Math.round((selectedGraphNode.probability || 0) * 100)}%</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </FeatureShell>

      <FeatureShell
        accent="rose"
        title="Feature 5: Threat Investigation"
        subtitle="Analyst case file combining detection, forecast, graph, and evidence"
        empty={!investigation}
        emptyText="Click Build Case to fill this feature area."
      >
        {investigation && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <div className="grid gap-4 md:grid-cols-4">
                <MiniStat label="Case" value={investigation.case_id} />
                <MiniStat label="Priority" value={investigation.priority} />
                <MiniStat label="Risk" value={`${investigation.risk_score}%`} />
                <MiniStat label="Predicted" value={investigation.predicted_stage} />
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <FeatureList title="Suspect hosts" items={(investigation.suspect_hosts || []).map((host) => `${host.host} (${host.risk})`)} />
                <FeatureList title="Suspicious links" items={(investigation.suspicious_connections || []).map((link) => `${link.source} -> ${link.target}`)} />
              </div>
            </div>
            <div className="space-y-4">
              <EvidenceList title="Case evidence" items={investigation.evidence} />
              <EvidenceList title="Recommended actions" items={investigation.recommended_actions} />
            </div>
          </div>
        )}
      </FeatureShell>

      <FeatureShell
        accent="violet"
        title="Feature 6: Explainable AI"
        subtitle="Why the current risk score moved, from live attributions on this window"
        empty={!explanation}
        emptyText="Click Explain Why to fill this feature area."
      >
        {explanation && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <div className="grid gap-4 md:grid-cols-4">
                <MiniStat label="Method" value={explanation.method} />
                <MiniStat label="Stage" value={explanation.predicted_stage || explanation.current_attack} />
                <MiniStat label="Risk" value={`${explanation.current_risk}%`} />
                <MiniStat label="Confidence" value={`${explanation.confidence ?? "--"}%`} />
              </div>
              <div className="mt-5 space-y-3">
                {(explanation.contributions || []).slice(0, 6).map((item) => (
                  <ContributionBar key={item.key || item.feature} feature={item.feature} value={item.contribution_pct} />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <EvidenceList title="Why this prediction" items={explanation.evidence} />
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{explanation.caveat}</p>
            </div>
          </div>
        )}
      </FeatureShell>

      <FeatureShell
        accent="orange"
        title="Feature 7: Threat Risk Scoring"
        subtitle="Comprehensive risk assessment with forecasting and drivers"
        empty={!riskScore}
        emptyText="Click Score Risk to fill this feature area."
      >
        {riskScore && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <div className="grid gap-4 md:grid-cols-4">
                <MiniStat label="Overall Score" value={`${riskScore.overall_risk_score}/100`} />
                <MiniStat label="Level" value={riskScore.risk_level} />
                <MiniStat label="Current Risk" value={riskScore.current_risk} />
                <MiniStat label="Future Risk" value={riskScore.future_risk} />
              </div>
              <div className="mt-6">
                <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Risk Breakdown</div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(riskScore.components || {}).map(([key, val]) => (
                    <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                      <div className="text-xs text-slate-500 dark:text-slate-400">{key}</div>
                      <div className="mt-1 font-bold text-slate-950 dark:text-slate-200">{val}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6">
                <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Risk Trend</div>
                <div className="flex flex-wrap items-center gap-2">
                  {(riskScore.risk_trend || []).map((trend, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="rounded border bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900">
                        {trend.timestamp}: {trend.risk}
                      </div>
                      {idx < riskScore.risk_trend.length - 1 && <ArrowRight className="h-3 w-3 text-slate-400" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <EvidenceList title="Top Risk Drivers" items={(riskScore.top_risk_drivers || []).map(d => `${d.feature}: ${d.contribution_pct}%`)} />
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/40">
                <h3 className="text-sm font-bold text-orange-900 dark:text-orange-100">Why did risk change?</h3>
                <p className="mt-2 text-sm leading-relaxed text-orange-800 dark:text-orange-200">
                  {riskScore.explanation}
                </p>
              </div>
            </div>
          </div>
        )}
      </FeatureShell>
    </PageShell>
  );
};

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
    <Icon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
    <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{value}</div>
  </div>
);

const MiniStat = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-2 text-base font-bold text-slate-950 dark:text-white">{value}</div>
  </div>
);

const FeatureShell = ({ accent, title, subtitle, empty, emptyText, children }) => {
  const accentClasses = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
    amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-200",
    rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
    violet: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200",
    orange: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200",
  };

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold uppercase ${accentClasses[accent]}`}>
          {accent}
        </span>
      </div>
      {empty ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
          {emptyText}
        </div>
      ) : (
        children
      )}
    </section>
  );
};

const EvidenceList = ({ title, items = [] }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
    <h3 className="text-sm font-bold text-slate-950 dark:text-white">{title}</h3>
    <div className="mt-3 space-y-2">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="rounded-lg bg-white p-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {item}
        </div>
      ))}
    </div>
  </div>
);

const FeatureList = ({ title, items = [] }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
    <h3 className="text-sm font-bold text-slate-950 dark:text-white">{title}</h3>
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {item}
        </span>
      ))}
    </div>
  </div>
);

const ForecastStepCard = ({ step }) => (
  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-bold uppercase text-blue-700 dark:text-blue-200">Step {step.step}</span>
      <span className="text-sm font-bold text-slate-950 dark:text-white">{Math.round(step.risk * 100)}%</span>
    </div>
    <div className="mt-3 text-sm font-bold text-slate-950 dark:text-white">{step.stage}</div>
    <div className="mt-2 text-xs font-semibold text-slate-500">Confidence {Math.round(step.confidence * 100)}%</div>
  </div>
);

const TimelineLane = ({ title, events = [], predicted = false }) => (
  <div>
    <h3 className="text-base font-bold text-slate-950 dark:text-white">{title}</h3>
    <div className="mt-4 space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className={`rounded-xl border p-4 ${
            predicted
              ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40"
              : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-slate-950 dark:text-white">{event.stage}</span>
            <span className="text-sm font-bold text-slate-950 dark:text-white">{event.risk}%</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{event.summary}</p>
          <div className="mt-3 text-xs font-semibold text-slate-500">
            {event.timestamp ? new Date(event.timestamp).toLocaleString() : `Future step ${event.step}`}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ContributionBar = ({ feature, value = 0 }) => {
  const percent = Number(value || 0);
  const positive = percent >= 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{feature}</span>
        <span className={`text-sm font-bold ${positive ? "text-rose-600" : "text-emerald-600"}`}>
          {positive ? "+" : ""}{percent.toFixed(1)}%
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-full rounded-full ${positive ? "bg-rose-600" : "bg-emerald-600"}`}
          style={{ width: `${Math.min(100, Math.abs(percent))}%` }}
        />
      </div>
    </div>
  );
};

const SignalBar = ({ label, value = 0, color = "blue" }) => {
  const percent = Math.round(Number(value || 0) * 100);
  const barColor = color === "emerald" ? "bg-emerald-600" : "bg-blue-600";

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-sm font-bold text-slate-950 dark:text-white">{percent}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
    </div>
  );
};

export default NetworkIntrusion;
