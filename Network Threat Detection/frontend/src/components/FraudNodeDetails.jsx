import { X } from "lucide-react";

const FraudNodeDetails = ({ record, onClose }) => {
  if (!record) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{record.modelDisplayName || "User Account"}</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{record.prediction || record.name}</h2>
        </div>
        <button type="button" onClick={onClose} className="btn-secondary px-3" aria-label="Close details">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {[
          ["Model Name", record.modelName],
          ["Detected By", record.source],
          ["Probability", `${Math.round((record.probability || 0) * 100)}%`],
          ["Status", record.status],
          ["Timestamp", record.timestamp],
          ["Risk Category", record.risk],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-bold text-slate-950 dark:text-white">{value || "N/A"}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-bold text-slate-950 dark:text-white">Recommendation</h3>
        <ul className="mt-3 space-y-2">
          {(record.recommendation || []).map((item) => (
            <li key={item} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-200">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FraudNodeDetails;

