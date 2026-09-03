export const calculateRiskScore = (history) => {
  const suspiciousRecords = history.filter((record) => record.suspicious);
  if (suspiciousRecords.length === 0) return 0;

  const weightedTotal = suspiciousRecords.reduce((total, record) => {
    const probability = typeof record.probability === "number" ? record.probability : 0.6;
    const severityBoost = record.risk === "Critical" ? 1.1 : record.risk === "High" ? 1.04 : 1;
    return total + Math.min(probability * severityBoost, 1);
  }, 0);

  return Math.round((weightedTotal / suspiciousRecords.length) * 100);
};

export const riskScoreLabel = (score) => {
  if (score >= 90) return "Critical Risk";
  if (score >= 75) return "High Risk";
  if (score >= 45) return "Elevated Risk";
  if (score > 0) return "Watchlist";
  return "No Risk";
};

export const riskScoreColor = (score) => {
  if (score >= 90) return "text-red-700";
  if (score >= 75) return "text-orange-600";
  if (score >= 45) return "text-amber-600";
  if (score > 0) return "text-yellow-600";
  return "text-emerald-600";
};

