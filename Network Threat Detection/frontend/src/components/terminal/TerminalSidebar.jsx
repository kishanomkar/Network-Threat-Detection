import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, ShieldAlert, BarChart3, LineChart, GitCommit, Network, 
  Search, BrainCircuit, Gauge, HardDriveUpload, Activity, ChevronRight
} from "lucide-react";
import { useNetwork } from "../../context/NetworkContext";

const navGroups = [
  {
    group: "COMMAND CENTER",
    items: [
      { label: "Overview", path: "/network", icon: LayoutDashboard }
    ]
  },
  {
    group: "DETECTION",
    items: [
      { label: "Current Threats", path: "/network/threats", icon: ShieldAlert },
      { label: "Traffic Analysis", path: "/network/traffic", icon: BarChart3 }
    ]
  },
  {
    group: "FORECASTING",
    items: [
      { label: "Attack Forecast", path: "/network/forecast", icon: LineChart },
      { label: "Attack Progression", path: "/network/progression", icon: GitCommit }
    ]
  },
  {
    group: "INVESTIGATION",
    items: [
      { label: "Network Graph", path: "/network/graph", icon: Network },
      { label: "Threat Investigation", path: "/network/investigation", icon: Search },
      { label: "Explainable AI", path: "/network/explainability", icon: BrainCircuit }
    ]
  },
  {
    group: "RISK",
    items: [
      { label: "Risk Intelligence", path: "/network/risk", icon: Gauge }
    ]
  },
  {
    group: "SYSTEM",
    items: [
      { label: "Data & Capture", path: "/network/data", icon: HardDriveUpload },
      { label: "Model Health", path: "/network/models", icon: Activity }
    ]
  }
];

export default function TerminalSidebar() {
  const { health, dataset } = useNetwork();
  const isOnline = health?.status === "healthy";

  return (
    <aside className="w-64 shrink-0 bg-[#0b0f19] border-r border-[#1a2333] flex flex-col h-screen sticky top-0 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#1a2333] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-cyan-500/10 border border-cyan-500/40 rounded flex items-center justify-center text-cyan-400 font-mono font-black text-sm">
            N
          </div>
          <div>
            <div className="font-mono font-bold text-slate-100 tracking-wider text-sm flex items-center gap-1.5">
              NETRA
              <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1 py-0.5 rounded font-sans border border-cyan-500/30">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">Empowering Cyber Defense</div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 text-xs font-mono">
        {navGroups.map((sec) => (
          <div key={sec.group}>
            <div className="px-3 mb-1.5 text-[10px] font-semibold text-slate-500 tracking-wider uppercase">
              {sec.group}
            </div>
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/network"}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-1.5 rounded transition ${
                        isActive
                          ? "bg-cyan-950/60 text-cyan-300 font-medium border border-cyan-800/60"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 opacity-40" />
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-[#1a2333] bg-[#080c14] text-[11px] font-mono space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">BACKEND STATUS</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            <span className={isOnline ? "text-emerald-400" : "text-red-400"}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
        </div>
        <div className="flex justify-between text-slate-400 text-[10px]">
          <span>DATASET</span>
          <span className="text-slate-200">{dataset || "CTU-13"}</span>
        </div>
      </div>
    </aside>
  );
}
