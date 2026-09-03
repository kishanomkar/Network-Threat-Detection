import { Clock, ShieldAlert, ShieldCheck } from "lucide-react";

const PredictionTimeline = ({ events }) => (
  <section className="panel p-5">
    <div className="mb-4 flex items-center gap-3">
      <Clock className="h-5 w-5 text-blue-600" />
      <h2 className="text-lg font-bold text-slate-950 dark:text-white">Fraud Timeline</h2>
    </div>
    <div className="space-y-3">
      {events.length === 0 && (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
          No prediction events yet.
        </p>
      )}
      {events.slice(0, 8).map((event) => {
        const Icon = event.suspicious ? ShieldAlert : ShieldCheck;
        return (
          <div key={event.id} className="flex gap-3">
            <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${event.suspicious ? "bg-red-50 text-red-600 dark:bg-red-950" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950"}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-950 dark:text-white">{event.modelDisplayName}</p>
                <span className="text-xs text-slate-500">{event.timestamp}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {event.prediction} | Risk {event.risk} | {Math.round((event.probability || 0) * 100)}%
              </p>
            </div>
          </div>
        );
      })}
    </div>
  </section>
);

export default PredictionTimeline;

