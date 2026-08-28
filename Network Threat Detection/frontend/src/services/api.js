import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const normalizeApiError = (error) => {
  if (error.code === "ECONNABORTED") {
    return "The request timed out. Please try again.";
  }

  if (!error.response) {
    return "Unable to reach the FastAPI backend. Make sure it is running on http://127.0.0.1:8000.";
  }

  const { status, data } = error.response;
  const backendMessage = data?.message || data?.detail;

  if (status === 400) return backendMessage || "The request could not be processed.";
  if (status === 404) return backendMessage || "The requested model endpoint was not found.";
  if (status === 422) return backendMessage || "Please check the feature names and values.";
  if (status >= 500) return backendMessage || "The backend had a prediction error.";

  return backendMessage || "Something went wrong while contacting the API.";
};

const request = async (callback) => {
  try {
    const response = await callback();
    return response.data;
  } catch (error) {
    throw new Error(normalizeApiError(error));
  }
};

export const getApiInfo = () => request(() => apiClient.get("/"));
export const getHealth = () => request(() => apiClient.get("/health"));
export const getProjectOverview = () => request(() => apiClient.get("/api/project/overview"));
export const detectCurrentThreat = (payload) => request(() => apiClient.post("/api/threats/current", payload));
export const forecastNetworkTraffic = (payload) => request(() => apiClient.post("/api/forecast/file", payload));
export const buildAttackTimeline = (payload) => request(() => apiClient.post("/api/timeline/progression", payload));
export const buildNetworkGraph = (payload) => request(() => apiClient.post("/api/graph/network", payload));
export const buildInvestigationCase = (payload) => request(() => apiClient.post("/api/investigate/case", payload));
export const explainPrediction = (payload) => request(() => apiClient.post("/api/explain/why", payload));
export const scoreThreatRisk = (payload) => request(() => apiClient.post("/api/risk/score", payload));
export const assessThreatRisk = (payload) => request(() => apiClient.post("/api/risk/assessment", payload));
export const predictNetwork = (payload) => request(() => apiClient.post("/predict/network_intrusion", payload));
export const predictGeneral = (payload) => request(() => apiClient.post("/predict/general", payload));
export const predictFraud = (payload) => request(() => apiClient.post("/predict/fraud", payload));
export const predictCreditCard = (payload) => request(() => apiClient.post("/predict/credit_card", payload));
export const analyzeNetworkTraffic = (payload) => request(() => apiClient.post("/api/analyze", payload));
