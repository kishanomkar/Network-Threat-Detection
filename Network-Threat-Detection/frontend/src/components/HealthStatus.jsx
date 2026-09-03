import { Activity, RefreshCw, Server } from "lucide-react";
import Loader from "./Loader.jsx";

const HealthStatus = ({ health, loading, onRefresh }) => (
  <section className="panel p-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <Activity className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">API Status</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Auto-refreshes every 30 seconds</p>
        </div>
      </div>
      <button type="button" onClick={onRefresh} className="btn-secondary" disabled={loading}>
        <RefreshCw className="h-4 w-4" />
        Refresh
      </button>
    </div>

    {loading && (
      <div className="mt-6">
        <Loader label="Checking API health..." />
      </div>
    )}

    {health && (
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
          <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-xl font-bold capitalize text-slate-950 dark:text-white">{health.status}</span>
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Models</p>
          <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">{health.total_loaded_models}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
          <p className="text-sm text-slate-500 dark:text-slate-400">Uptime</p>
          <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">{health.uptime_seconds}s</p>
        </div>
        <div className="md:col-span-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Server className="h-4 w-4" />
            Loaded Models
          </div>
          <div className="flex flex-wrap gap-2">
            {health.loaded_models.map((model) => (
              <span
                key={model}
                className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-200"
              >
                {model}
              </span>
            ))}
          </div>
        </div>
      </div>
    )}
  </section>
);

export default HealthStatus;

