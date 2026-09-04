import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, ShieldAlert, BarChart3, LineChart, GitCommit, Network,
  Search, BrainCircuit, Gauge, HardDriveUpload, Activity, ChevronRight,
} from "lucide-react";
import { useNetwork } from "../../context/NetworkContext";

const navGroups = [
  { group: "COMMAND CENTER", items: [{ label: "Overview", path: "/network", icon: LayoutDashboard }] },
  {
    group: "DETECTION",
    items: [
      { label: "Current Threats", path: "/network/threats", icon: ShieldAlert },
      { label: "Traffic Analysis", path: "/network/traffic", icon: BarChart3 },
    ],
  },
  {
    group: "FORECASTING",
    items: [
      { label: "Attack Forecast", path: "/network/forecast", icon: LineChart },
      { label: "Attack Progression", path: "/network/progression", icon: GitCommit },
    ],
  },
  {
    group: "INVESTIGATION",
    items: [
      { label: "Network Graph", path: "/network/graph", icon: Network },
      { label: "Threat Investigation", path: "/network/investigation", icon: Search },
      { label: "Explainable AI", path: "/network/explainability", icon: BrainCircuit },
    ],
  },
  { group: "RISK", items: [{ label: "Risk Intelligence", path: "/network/risk", icon: Gauge }] },
  {
    group: "SYSTEM",
    items: [
      { label: "Data & Capture", path: "/network/data", icon: HardDriveUpload },
      { label: "Model Health", path: "/network/models", icon: Activity },
    ],
  },
];

export default function TerminalSidebar() {
  const { health, dataset } = useNetwork();
  const isOnline = health?.status === "healthy";

  return (
    <aside className="w-[17.5rem] xl:w-[21.875rem] shrink-0 bg-white/95 border-r border-slate-200 flex flex-col h-screen sticky top-0 text-slate-700 select-none shadow-[6px_0_28px_rgba(15,23,42,0.03)]">
      <div className="px-6 pt-7 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-1 text-[1.65rem] leading-none font-extrabold tracking-[-0.06em] text-slate-950">
          <span>Netra</span>
          <span className="-ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#dfff2f] text-[1.38rem] tracking-[-0.08em]">AI</span>
        </div>
        <div className="mt-3 text-sm font-medium tracking-[-0.02em] text-slate-500">Empowering Cyber Defense</div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-5 text-[0.93rem]">
        {navGroups.map((section) => (
          <div key={section.group}>
            <div className="px-2.5 mb-2 text-[0.64rem] font-bold text-slate-500 tracking-wide uppercase">{section.group}</div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/network"}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all duration-200 ${
                        isActive
                          ? "bg-[#dfff2f] text-slate-900 font-semibold shadow-[0_6px_18px_rgba(179,218,5,0.17)]"
                          : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                      }`
                    }
                  >
                    <div className="flex items-center gap-3"><Icon className="w-[1.15rem] h-[1.15rem]" /><span>{item.label}</span></div>
                    <ChevronRight className="w-4 h-4 opacity-55" />
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>


    </aside>
  );
}
