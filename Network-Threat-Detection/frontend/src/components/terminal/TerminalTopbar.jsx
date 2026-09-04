import { Play, RotateCw, Database, Clock } from "lucide-react";
import { useNetwork } from "../../context/NetworkContext";

export default function TerminalTopbar({ title }) {
  const { path, setPath, analyzing, runFullAnalysis, lastAnalysis, health } = useNetwork();

  return (
    <header className="min-h-[5.75rem] bg-white/95 border-b border-slate-200 px-5 lg:px-7 flex items-center justify-between sticky top-0 z-30 text-xs gap-5">
      <div className="flex flex-1 items-center gap-3 lg:gap-5 min-w-0">
        <h1 className="min-w-0 truncate text-[1.18rem] font-extrabold text-slate-950 tracking-[-0.04em]">{title}</h1>
        <div className="hidden xl:block h-7 w-px bg-slate-200" />
        <div className="hidden sm:flex min-w-0 shrink items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.03)] text-slate-700">
          <Database className="w-4 h-4 text-[#34b94a]" />
          <span className="text-xs text-slate-500">Capture:</span>
          <input type="text" value={path} onChange={(event) => setPath(event.target.value)} aria-label="Capture path" className="min-w-0 bg-transparent border-none outline-none text-slate-700 text-xs w-28 lg:w-40 xl:w-52 2xl:w-72 focus:ring-0" />
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-5 shrink-0">
        <div className="hidden lg:flex items-center gap-1.5 text-slate-500 text-xs"><Clock className="w-4 h-4" /><span>Last Analysis:</span><span className="font-semibold text-slate-700">{lastAnalysis ? lastAnalysis.toLocaleTimeString() : "Never"}</span></div>
        <button onClick={runFullAnalysis} disabled={analyzing} className="flex items-center gap-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white px-4 py-3 font-bold tracking-wide transition disabled:opacity-50 shadow-[0_4px_12px_rgba(15,23,42,0.16)]">
          {analyzing ? <><RotateCw className="w-3.5 h-3.5 animate-spin" /><span>ANALYZING...</span></> : <><Play className="w-3.5 h-3.5 fill-current" /><span>RUN ANALYSIS</span></>}
        </button>
        <div className="hidden md:flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
          <span className={`w-2.5 h-2.5 rounded-full ${health?.status === "healthy" ? "bg-[#32c83b]" : "bg-red-500"}`} />
          <span className="text-xs text-slate-700 font-semibold">{health?.status === "healthy" ? "Backend: Online" : "Backend: Offline"}</span>
        </div>
      </div>
    </header>
  );
}
