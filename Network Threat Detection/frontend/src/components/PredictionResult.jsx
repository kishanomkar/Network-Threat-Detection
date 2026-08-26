import { CheckCircle2, Copy, Download } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { downloadJson } from "../utils/format.js";

const PredictionResult = ({ result }) => {
  if (!result) return null;

  const probability = typeof result.probability === "number" ? result.probability : null;
  const confidencePercent = probability === null ? 0 : Math.round(probability * 100);

  const copyResult = async () => {
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast.success("JSON response copied");
  };

  const downloadResult = () => {
    downloadJson(`prediction-${result.model_name}-${Date.now()}.json`, result);
    toast.success("Prediction result downloaded");
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel overflow-hidden"
    >
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Prediction Result</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{result.timestamp}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={copyResult} className="btn-secondary">
            <Copy className="h-4 w-4" />
            Copy
          </button>
          <button type="button" onClick={downloadResult} className="btn-secondary">
            <Download className="h-4 w-4" />
            JSON
          </button>
        </div>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prediction</p>
          <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{result.prediction}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Model</p>
          <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{result.model_name}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
          <p className="mt-2 text-2xl font-bold capitalize text-emerald-600">{result.status}</p>
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700 dark:text-slate-200">Confidence</span>
          <span className="text-slate-500 dark:text-slate-400">
            {probability === null ? "Not available" : `${confidencePercent}%`}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidencePercent}%` }}
            className="h-full rounded-full bg-blue-600"
          />
        </div>
      </div>
    </motion.section>
  );
};

export default PredictionResult;

