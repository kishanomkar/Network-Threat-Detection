import { Search, Trash2 } from "lucide-react";

const HistoryPanel = ({ items, query, onQueryChange, onClear }) => (
  <aside className="panel p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">Recent Predictions</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{items.length} saved locally</p>
      </div>
      <button type="button" onClick={onClear} className="btn-secondary px-3" aria-label="Clear history">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
    <div className="relative mb-4">
      <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
      <input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        className="input pl-9"
        placeholder="Search history"
      />
    </div>
    <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
      {items.length === 0 && (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
          No prediction history yet.
        </p>
      )}
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-slate-950 dark:text-white">{item.modelName}</span>
            <span className="text-xs text-slate-500">{item.timestamp}</span>
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Prediction: <span className="font-semibold">{item.prediction}</span>
          </p>
        </div>
      ))}
    </div>
  </aside>
);

export default HistoryPanel;

