import { createContext, useCallback, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  assessThreatRisk,
  buildAttackTimeline,
  buildInvestigationCase,
  buildNetworkGraph,
  detectCurrentThreat,
  explainPrediction,
  fetchRiskTimeline,
  forecastNetworkTraffic,
  getHealth,
} from "../services/api.js";

const NetworkContext = createContext(null);

export const DEMO_PATH = ["data/raw/ctu13/ctu13_scenario1_neris_botnet.pcap","data/raw/ctu13/synthetic_traffic_safe.pcap"];

export function NetworkProvider({ children }) {
  const [path, setPath] = useState(DEMO_PATH[1]);
  const [dataset, setDataset] = useState("PCAP");
  const [health, setHealth] = useState(null);
  const [currentThreat, setCurrentThreat] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [networkGraph, setNetworkGraph] = useState(null);
  const [investigation, setInvestigation] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [riskTimeline, setRiskTimeline] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [lastAnalysis, setLastAnalysis] = useState(null);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth(null));
    const interval = setInterval(
      () => getHealth().then(setHealth).catch(() => setHealth(null)),
      30000
    );
    return () => clearInterval(interval);
  }, []);

  const basePayload = useCallback(
    (extra = {}) => ({
      path,
      dataset,
      scenario: "sih-internal-round",
      capture_id: "demo-capture",
      window_seconds: 10,
      max_records: 1000,
      ...extra,
    }),
    [path, dataset]
  );

  const runFullAnalysis = useCallback(async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setError(null);
    const id = toast.loading("Running full network analysis...");
    try {
      const [threat, fc, tl, graph, inv, expl, risk, rtl] = await Promise.allSettled([
        detectCurrentThreat(basePayload({ max_records: 1000 })),
        forecastNetworkTraffic(basePayload({ sequence_length: 5, horizon: 5 })),
        buildAttackTimeline(basePayload({ sequence_length: 5, horizon: 5, observed_limit: 10 })),
        buildNetworkGraph(basePayload({ graph_limit: 5 })),
        buildInvestigationCase(basePayload({ max_records: 250, sequence_length: 4, horizon: 3 })),
        explainPrediction(basePayload({ max_records: 400 })),
        assessThreatRisk(basePayload({ max_records: 400 })),
        fetchRiskTimeline(basePayload({ observed_limit: 12, horizon: 5 })),
      ]);

      const rejected = [threat, fc, tl, graph, inv, expl, risk, rtl].filter(
        (p) => p.status === "rejected"
      );

      if (rejected.length > 0) {
        const errMsg = rejected[0].reason?.message || "Failed to process network capture file.";
        setError(errMsg);
        toast.dismiss(id);
        toast.error(`Analysis failed: ${errMsg}`);
        return;
      }

      if (threat.status === "fulfilled") setCurrentThreat(threat.value);
      if (fc.status === "fulfilled") setForecast(fc.value);
      if (tl.status === "fulfilled") setTimeline(tl.value);
      if (graph.status === "fulfilled") setNetworkGraph(graph.value);
      if (inv.status === "fulfilled") setInvestigation(inv.value);
      if (expl.status === "fulfilled") setExplanation(expl.value);
      if (risk.status === "fulfilled") setRiskAssessment(risk.value);
      if (rtl.status === "fulfilled") setRiskTimeline(rtl.value);
      setLastAnalysis(new Date());
      toast.dismiss(id);
      toast.success("Analysis complete");
    } catch (err) {
      setError(err.message || "Analysis failed");
      toast.dismiss(id);
      toast.error("Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, basePayload]);

  const runThreat = useCallback(async () => { const d = await detectCurrentThreat(basePayload({ max_records: 1000 })); setCurrentThreat(d); return d; }, [basePayload]);
  const runForecast = useCallback(async () => { const d = await forecastNetworkTraffic(basePayload({ sequence_length: 5, horizon: 5 })); setForecast(d); return d; }, [basePayload]);
  const runTimeline = useCallback(async () => { const d = await buildAttackTimeline(basePayload({ sequence_length: 5, horizon: 5, observed_limit: 10 })); setTimeline(d); return d; }, [basePayload]);
  const runGraph = useCallback(async () => { const d = await buildNetworkGraph(basePayload({ graph_limit: 5 })); setNetworkGraph(d); return d; }, [basePayload]);
  const runInvestigation = useCallback(async () => { const d = await buildInvestigationCase(basePayload({ max_records: 250, sequence_length: 4, horizon: 3 })); setInvestigation(d); return d; }, [basePayload]);
  const runExplanation = useCallback(async () => { const d = await explainPrediction(basePayload({ max_records: 400 })); setExplanation(d); return d; }, [basePayload]);
  const runRisk = useCallback(async () => { const d = await assessThreatRisk(basePayload({ max_records: 400 })); setRiskAssessment(d); return d; }, [basePayload]);
  const runRiskTimeline = useCallback(async () => { const d = await fetchRiskTimeline(basePayload({ observed_limit: 12, horizon: 5 })); setRiskTimeline(d); return d; }, [basePayload]);

  return (
    <NetworkContext.Provider value={{ path, setPath, dataset, setDataset, health, currentThreat, forecast, timeline, networkGraph, investigation, explanation, riskAssessment, riskTimeline, analyzing, error, lastAnalysis, runFullAnalysis, runThreat, runForecast, runTimeline, runGraph, runInvestigation, runExplanation, runRisk, runRiskTimeline }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork must be inside NetworkProvider");
  return ctx;
}
