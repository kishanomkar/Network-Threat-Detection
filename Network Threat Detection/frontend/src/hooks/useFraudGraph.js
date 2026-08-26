import { useEffect, useMemo, useState } from "react";
import { buildGraph, graphReport } from "../utils/graphBuilder.js";
import { createHistoryRecord, getRecommendation } from "../utils/predictionUtils.js";
import { calculateRiskScore } from "../utils/riskCalculator.js";
import { downloadJson, formatTimestamp } from "../utils/format.js";

const FRAUD_HISTORY_KEY = "fraud-intelligence-history";

const loadHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(FRAUD_HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveHistory = (history) => {
  localStorage.setItem(FRAUD_HISTORY_KEY, JSON.stringify(history));
};

export const useFraudGraph = () => {
  const [history, setHistory] = useState(() => loadHistory());
  const [query, setQuery] = useState("");

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const riskScore = useMemo(() => calculateRiskScore(history), [history]);
  const graphData = useMemo(() => buildGraph(history), [history]);
  const suspiciousRecords = useMemo(() => history.filter((record) => record.suspicious), [history]);
  const timeline = useMemo(() => history.slice(0, 100), [history]);

  const filteredHistory = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return history;
    return history.filter((record) => {
      const haystack = `${record.modelDisplayName} ${record.prediction} ${record.risk} ${record.timestamp}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [history, query]);

  const recordPrediction = ({ response, payload }) => {
    const timestamp = formatTimestamp();
    const record = createHistoryRecord({ response, payload, timestamp });
    record.recommendation = getRecommendation(record);
    setHistory((current) => [record, ...current].slice(0, 1000));
    return record;
  };

  const clearHistory = () => setHistory([]);

  const exportHistory = () => {
    downloadJson(`fraud-history-${Date.now()}.json`, history);
  };

  const exportGraph = () => {
    downloadJson(`fraud-graph-${Date.now()}.json`, graphData);
  };

  const exportRiskReport = () => {
    downloadJson(`fraud-risk-report-${Date.now()}.json`, graphReport(history, riskScore));
  };

  const printDashboard = () => window.print();

  return {
    history,
    filteredHistory,
    query,
    setQuery,
    graphData,
    riskScore,
    suspiciousRecords,
    timeline,
    recordPrediction,
    clearHistory,
    exportHistory,
    exportGraph,
    exportRiskReport,
    printDashboard,
  };
};

