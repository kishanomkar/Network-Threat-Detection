const accountNode = {
  id: "account",
  name: "User Account",
  type: "account",
  probability: 0,
  risk: "Low",
};

export const nodeColor = (node) => {
  if (node.type === "account") return "#2563eb";
  if (node.risk === "Critical") return "#7f1d1d";
  if (node.risk === "High") return "#dc2626";
  if (node.risk === "Elevated") return "#f97316";
  if (node.risk === "Suspicious") return "#f59e0b";
  return "#16a34a";
};

export const nodeSize = (node) => {
  if (node.type === "account") return 8;
  const probability = typeof node.probability === "number" ? node.probability : 0.55;
  return 4 + probability * 8;
};

export const buildGraph = (history) => {
  const suspiciousRecords = history.filter((record) => record.suspicious);
  const nodes = [accountNode];
  const links = [];
  const seen = new Set(["account"]);

  suspiciousRecords.forEach((record) => {
    const nodeId = `${record.modelName}-${record.prediction}`;
    if (!seen.has(nodeId)) {
      nodes.push({
        id: nodeId,
        name: record.prediction,
        type: record.nodeType,
        probability: record.probability,
        risk: record.risk,
        modelName: record.modelName,
        source: record.source,
        timestamp: record.timestamp,
        record,
      });
      seen.add(nodeId);
    }

    links.push({
      source: "account",
      target: nodeId,
      label: "Detected By",
      confidence: record.probability,
      timestamp: record.timestamp,
    });
  });

  return { nodes, links };
};

export const graphReport = (history, riskScore) => ({
  generatedAt: new Date().toISOString(),
  riskScore,
  suspiciousCount: history.filter((record) => record.suspicious).length,
  totalPredictions: history.length,
  history,
  graph: buildGraph(history),
});

