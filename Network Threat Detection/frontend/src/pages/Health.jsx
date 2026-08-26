import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import ErrorAlert from "../components/ErrorAlert.jsx";
import HealthStatus from "../components/HealthStatus.jsx";
import PageShell from "../components/PageShell.jsx";
import { getHealth } from "../services/api.js";

const Health = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchHealth = useCallback(async (showToast = false) => {
    setLoading(true);
    setError("");
    try {
      const response = await getHealth();
      setHealth(response);
      if (showToast) toast.success("Health check passed");
    } catch (apiError) {
      const message = apiError.message || "API health check failed";
      setError(message);
      if (showToast) toast.error("API offline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const intervalId = window.setInterval(() => fetchHealth(), 30000);
    return () => window.clearInterval(intervalId);
  }, [fetchHealth]);

  return (
    <PageShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Health Status</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Monitor FastAPI availability, loaded models, and application uptime.
        </p>
      </div>
      <ErrorAlert message={error} />
      <div className="mt-6">
        <HealthStatus health={health} loading={loading} onRefresh={() => fetchHealth(true)} />
      </div>
    </PageShell>
  );
};

export default Health;

