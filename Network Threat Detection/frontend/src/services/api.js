import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://chilli-bomb.onrender.com/",
  timeout: 20000,
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
    return "Unable to reach the FastAPI backend. Make sure it is running on https://chilli-bomb.onrender.com/.";
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
export const predictNetwork = (payload) => request(() => apiClient.post("/predict/network_intrusion", payload));
export const predictGeneral = (payload) => request(() => apiClient.post("/predict/general", payload));
export const predictFraud = (payload) => request(() => apiClient.post("/predict/fraud", payload));
export const predictCreditCard = (payload) => request(() => apiClient.post("/predict/credit_card", payload));
