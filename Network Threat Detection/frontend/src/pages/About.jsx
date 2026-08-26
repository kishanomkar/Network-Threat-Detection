import { useEffect, useState } from "react";
import ErrorAlert from "../components/ErrorAlert.jsx";
import PageShell from "../components/PageShell.jsx";
import { getApiInfo } from "../services/api.js";

const About = () => {
  const [apiInfo, setApiInfo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInfo = async () => {
      try {
        setApiInfo(await getApiInfo());
      } catch (apiError) {
        setError(apiError.message || "Could not load API information.");
      }
    };
    loadInfo();
  }, []);

  return (
    <PageShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">About</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          React frontend for a local FastAPI inference server.
        </p>
      </div>
      <ErrorAlert message={error} />
      <section className="panel mt-6 p-5">
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">
          {apiInfo?.application || "Multi Model Prediction API"}
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Version {apiInfo?.version || "1.0.0"}
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {(apiInfo?.available_endpoints || [
            "/predict/network_intrusion",
            "/predict/general",
            "/predict/fraud",
            "/predict/credit_card",
            "/health",
          ]).map((endpoint) => (
            <div key={endpoint} className="rounded-xl bg-slate-50 p-4 font-mono text-sm dark:bg-slate-950">
              {endpoint}
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
};

export default About;

