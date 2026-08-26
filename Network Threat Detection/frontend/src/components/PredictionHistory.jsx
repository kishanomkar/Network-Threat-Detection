import { Download, FileJson, Printer, Search, Trash2 } from "lucide-react";

const PredictionHistory = ({
  items,
  query,
  onQueryChange,
  onClear,
  onExportHistory,
  onExportGraph,
  onExportReport,
  onPrint,
}) => (
  <section className="panel p-5">
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">Prediction History</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Stored locally with export tools</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onExportGraph} className="btn-secondary">
          <FileJson className="h-4 w-4" />
          Graph
        </button>
        <button type="button" onClick={onExportHistory} className="btn-secondary">
          <Download className="h-4 w-4" />
          History
        </button>
        <button type="button" onClick={onExportReport} className="btn-secondary">
          <FileJson className="h-4 w-4" />
          Report
        </button>
        <button type="button" onClick={onPrint} className="btn-secondary">
          <Printer className="h-4 w-4" />
          Print
        </button>
        <button type="button" onClick={onClear} className="btn-secondary">
          <Trash2 className="h-4 w-4" />
          Clear
        </button>
      </div>
    </div>
    <div className="relative mt-4">
      <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
      <input value={query} onChange={(event) => onQueryChange(event.target.value)} className="input pl-9" placeholder="Filter by model, prediction, or risk" />
    </div>
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="hidden grid-cols-[1fr_1fr_90px_110px] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-950 md:grid">
        <span>Model</span>
        <span>Prediction</span>
        <span>Risk</span>
        <span>Time</span>
      </div>
      {items.slice(0, 12).map((item) => (
        <div key={item.id} className="border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800 md:grid md:grid-cols-[1fr_1fr_90px_110px] md:gap-3">
          <div className="font-semibold text-slate-950 dark:text-white">{item.modelDisplayName}</div>
          <div className="mt-1 break-words text-slate-600 dark:text-slate-300 md:mt-0 md:truncate">{item.prediction}</div>
          <div className={`mt-2 font-bold md:mt-0 ${item.suspicious ? "text-red-600" : "text-emerald-600"}`}>{item.risk}</div>
          <div className="mt-1 text-slate-500 md:mt-0 md:truncate">{item.timestamp}</div>
        </div>
      ))}
      {items.length === 0 && (
        <p className="border-t border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">
          No history records match the current filter.
        </p>
      )}
    </div>
  </section>
);

export default PredictionHistory;
