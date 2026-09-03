import { Siren } from "lucide-react";

const RecentAlerts = ({ alerts, onSelect }) => (
  <section className="panel p-5">
    <div className="mb-4 flex items-center gap-3">
      <Siren className="h-5 w-5 text-red-600" />
      <h2 className="text-lg font-bold text-slate-950 dark:text-white">Recent Alerts</h2>
    </div>
    <div className="space-y-3">
      {alerts.length === 0 && (
        <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
          No suspicious alerts.
        </p>
      )}
      {alerts.slice(0, 6).map((alert) => (
        <button
          key={alert.id}
          type="button"
          onClick={() => onSelect(alert)}
          className="w-full rounded-xl border border-red-100 bg-red-50 p-4 text-left transition hover:border-red-200 dark:border-red-950 dark:bg-red-950/30"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold text-red-700 dark:text-red-200">{alert.prediction}</p>
            <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-red-700 dark:bg-red-950 dark:text-red-200">
              {Math.round((alert.probability || 0) * 100)}%
            </span>
          </div>
          <p className="mt-2 text-sm text-red-700/80 dark:text-red-200/80">
            {alert.modelDisplayName} | {alert.timestamp}
          </p>
        </button>
      ))}
    </div>
  </section>
);

export default RecentAlerts;

