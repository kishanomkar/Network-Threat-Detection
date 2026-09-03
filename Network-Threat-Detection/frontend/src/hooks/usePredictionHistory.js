import { useEffect, useMemo, useState } from "react";
import { readHistory, writeHistory } from "../utils/storage.js";

export const usePredictionHistory = () => {
  const [history, setHistory] = useState(() => readHistory());
  const [query, setQuery] = useState("");

  useEffect(() => {
    writeHistory(history);
  }, [history]);

  const addPrediction = (item) => {
    setHistory((current) => [item, ...current].slice(0, 50));
  };

  const clearHistory = () => setHistory([]);

  const filteredHistory = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return history;

    return history.filter((item) => {
      const haystack = `${item.modelName} ${item.prediction} ${item.timestamp}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [history, query]);

  return {
    history,
    filteredHistory,
    query,
    setQuery,
    addPrediction,
    clearHistory,
  };
};

