import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ErrorAlert from "../components/ErrorAlert.jsx";
import FeatureInput from "../components/FeatureInput.jsx";
import HistoryPanel from "../components/HistoryPanel.jsx";
import Loader from "../components/Loader.jsx";
import PageShell from "../components/PageShell.jsx";
import PredictionResult from "../components/PredictionResult.jsx";
import { formatTimestamp } from "../utils/format.js";

const PredictionPage = ({ model, history, intelligence }) => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const runPrediction = async (payload) => {
    setLoading(true);
    setError("");

    try {
      const response = await model.predict(payload);
      const timestamp = formatTimestamp();
      const enrichedResponse = { ...response, timestamp };
      intelligence?.recordPrediction({ response, payload });
      setResult(enrichedResponse);
      history.addPrediction({
        id: crypto.randomUUID(),
        modelName: response.model_name,
        prediction: response.prediction,
        timestamp,
        response: enrichedResponse,
        payload,
      });
      toast.success("Prediction successful");
    } catch (apiError) {
      const message = apiError.message || "Prediction failed";
      setError(message);
      toast.error("Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.querySelector("input")?.focus();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const Icon = model.icon;

  return (
    <PageShell>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
            <Icon className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {model.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {model.description}
          </p>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {model.endpoint}
        </span>
      </div>

      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
        {model.helper}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <FeatureInput model={model} loading={loading} onSubmit={runPrediction} />
          {loading && (
            <div className="panel p-5">
              <Loader />
            </div>
          )}
          <ErrorAlert message={error} />
          <PredictionResult result={result} />
        </div>
        <HistoryPanel
          items={history.filteredHistory}
          query={history.query}
          onQueryChange={history.setQuery}
          onClear={history.clearHistory}
        />
      </div>
    </PageShell>
  );
};

export default PredictionPage;
