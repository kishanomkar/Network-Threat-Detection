import { Play, RotateCw, Database, Clock } from "lucide-react";
import { useNetwork } from "../../context/NetworkContext";

export default function TerminalTopbar({ title }) {
  const { path, setPath, analyzing, runFullAnalysis, lastAnalysis, health } = useNetwork();

  return (
    <header className="h-14 bg-[#0d121f] border-b border-[#1a2333] px-6 flex items-center justify-between sticky top-0 z-30 font-mono text-xs">
      <div className="flex items-center gap-4">
        <h1 className="text-base font-bold text-slate-100 font-sans tracking-tight">{title}</h1>
        <div className="h-4 w-px bg-[#1a2333]" />
        
        {/* Active Dataset Input */}
        <div className="flex items-center gap-2 bg-[#080c14] border border-[#1a2333] px-2.5 py-1 rounded text-slate-300">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] text-slate-500">Capture:</span>
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="bg-transparent border-none outline-none text-slate-200 text-xs w-64 font-mono focus:ring-0"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Last Analysis time */}
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <Clock className="w-3.5 h-3.5" />
          <span>Last Analysis:</span>
          <span className="text-slate-200">
            {lastAnalysis ? lastAnalysis.toLocaleTimeString() : "Never"}
          </span>
        </div>

        {/* Quick Action */}
        <button
          onClick={runFullAnalysis}
          disabled={analyzing}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-3 py-1.5 rounded font-bold transition disabled:opacity-50"
        >
          {analyzing ? (
            <>
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>ANALYZING...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>RUN ANALYSIS</span>
            </>
          )}
        </button>

        {/* Backend Quick Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#080c14] border border-[#1a2333] rounded">
          <span className={`w-2 h-2 rounded-full ${health?.status === "healthy" ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} />
          <span className="text-[11px] text-slate-300 font-semibold">
            {health?.status === "healthy" ? "Backend: Online" : "Backend: Offline"}
          </span>
        </div>
      </div>
    </header>
  );
}
