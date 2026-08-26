const SAFE_LABELS = ["normal", "safe", "benign", "no fraud", "not fraud", "legitimate", "clean"];

const SUSPICIOUS_KEYWORDS = [
  "fraud",
  "credit card fraud",
  "network intrusion",
  "money laundering",
  "malware",
  "attack",
  "high risk",
  "phishing",
  "bot",
  "sql injection",
  "brute force",
  "port scan",
  "ddos",
  "suspicious",
  "anomaly",
  "malicious",
  "account takeover",
  "identity theft",
  "data leak",
  "data exfiltration",
  "unknown threat",
];

export const modelSourceMap = {
  network_intrusion: "network_intrusion_detection_model.pkl",
  general: "model.pkl",
  fraud: "fraud_detection_model.pkl",
  credit_card: "credit_card_model.pkl",
};

export const modelDisplayMap = {
  network_intrusion: "Network Intrusion",
  general: "General Model",
  fraud: "Fraud Detection",
  credit_card: "Credit Card",
};

export const normalizePrediction = (prediction) => String(prediction ?? "").trim().toLowerCase();

export const isFraudPrediction = (prediction) => {
  const normalized = normalizePrediction(prediction);
  if (!normalized) return false;
  if (SAFE_LABELS.includes(normalized)) return false;
  if (["0", "false"].includes(normalized)) return false;
  if (["1", "true"].includes(normalized)) return true;
  return SUSPICIOUS_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

export const getRiskLevel = (probability = 0, suspicious = false) => {
  if (!suspicious) return "Low";
  if (probability >= 0.95) return "Critical";
  if (probability >= 0.85) return "High";
  if (probability >= 0.65) return "Elevated";
  return "Suspicious";
};

export const getNodeType = (modelName, prediction) => {
  const normalized = normalizePrediction(prediction);
  if (modelName === "credit_card") return "credit_card";
  if (modelName === "fraud") return "financial_fraud";
  if (modelName === "network_intrusion") return "network_attack";
  if (normalized.includes("malware")) return "malware";
  if (normalized.includes("anomaly")) return "anomaly";
  return "threat";
};

export const formatPredictionLabel = (modelName, prediction) => {
  const normalized = normalizePrediction(prediction);

  if (["0", "false"].includes(normalized)) return "No Fraud";
  if (modelName === "credit_card" && ["1", "true"].includes(normalized)) {
    return "Credit Card Fraud";
  }
  if (modelName === "fraud" && ["1", "true"].includes(normalized)) {
    return "Fraud Transaction";
  }
  if (modelName === "general" && ["1", "true"].includes(normalized)) {
    return "High Risk Fraud";
  }
  if (modelName === "network_intrusion" && normalized === "anomaly") {
    return "Network Intrusion";
  }

  return String(prediction ?? "Unknown");
};

export const getRecommendation = (record) => {
  if (record.modelName === "credit_card") {
    return ["Freeze card", "Review recent transactions", "Notify customer"];
  }
  if (record.modelName === "fraud") {
    return ["Hold transaction", "Verify beneficiary", "Escalate to fraud operations"];
  }
  if (record.modelName === "network_intrusion") {
    return ["Isolate host", "Inspect network logs", "Block suspicious source"];
  }
  return ["Review evidence", "Increase monitoring", "Open analyst investigation"];
};

export const createHistoryRecord = ({ response, payload, timestamp }) => {
  const suspicious = isFraudPrediction(response.prediction);
  const probability = typeof response.probability === "number" ? response.probability : 0;
  const displayPrediction = formatPredictionLabel(response.model_name, response.prediction);
  return {
    id: crypto.randomUUID(),
    modelName: response.model_name,
    modelDisplayName: modelDisplayMap[response.model_name] || response.model_name,
    source: modelSourceMap[response.model_name] || "unknown model",
    rawPrediction: response.prediction,
    prediction: displayPrediction,
    probability,
    status: response.status,
    timestamp,
    risk: getRiskLevel(probability, suspicious),
    suspicious,
    nodeType: getNodeType(response.model_name, response.prediction),
    recommendation: [],
    payload,
    response,
  };
};
