import TerminalLayout from "../../layouts/TerminalLayout";
import { useNetwork } from "../../context/NetworkContext";
import { Activity, CheckCircle2, XCircle, Cpu, Server } from "lucide-react";

export default function ModelHealth() {
  const { health } = useNetwork();

  const isOnline = health?.status === "healthy";
  const loadedModels = health?.loaded_models ?? ["ANTCM Model", "LSTM World Model"];

  const modules = [
    { name: "ANTCM Threat Model", status: "Healthy", version: "v1.0.0", latency: "12ms", desc: "Pretrained baseline classifier" },
    { name: "LSTM World Model", status: "Healthy", version: "v1.0.0", latency: "18ms", desc: "Temporal state forecasting model" },
    { name: "Feature Engine", status: "Healthy", version: "v1.0.0", latency: "15ms", desc: "Network state builder & canonical windowing" },
    { name: "Explainability Engine", status: "Healthy", version: "v1.0.0", latency: "35ms", desc: "Monte Carlo Shapley value sampler" },
    { name: "FastAPI Backend", status: isOnline ? "Healthy" : "Offline", version: "v0.2.0", latency: "5ms", desc: "REST API service layer" },
  ];

  return (
    <TerminalLayout title="Model Health & System Diagnostics">
      <div className="space-y-6 font-mono">
        {/* System Health Overview */}
        <div className="bg-[#FAF2CA] border border-[#1a2333] p-5 rounded-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOnline ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-red-950 text-red-400 border border-red-800"}`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-200">System Readiness: {isOnline ? "OPERATIONAL" : "DEGRADED"}</div>
              <div className="text-xs text-slate-500">Uptime: {health?.uptime_seconds ?? 0} seconds | Active Models: {loadedModels.length}</div>
            </div>
          </div>
          <span className={`px-3 py-1 text-xs font-bold rounded uppercase ${isOnline ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-red-950 text-red-400 border border-red-800"}`}>
            {isOnline ? "ALL SYSTEMS GO" : "OFFLINE"}
          </span>
        </div>

        {/* Modules Table */}
        <div className="bg-[#FAF2CA] border border-[#1a2333] p-4 rounded-sm space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Subsystem Status Diagnostics</h3>
          <div className="space-y-3">
            {modules.map((m) => (
              <div key={m.name} className="bg-[#080c14] p-4 border border-[#1a2333] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">{m.name}</div>
                    <div className="text-[11px] text-slate-500">{m.desc}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-xs">
                  <span className="text-slate-400">Version: {m.version}</span>
                  <span className="text-slate-400">Latency: {m.latency}</span>
                  <span className={`flex items-center gap-1 font-bold ${m.status === "Healthy" ? "text-emerald-400" : "text-red-400"}`}>
                    <CheckCircle2 className="w-4 h-4" /> {m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TerminalLayout>
  );
}
