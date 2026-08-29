import TerminalLayout from "../../layouts/TerminalLayout";
import MetricCard from "../../components/terminal/MetricCard";
import RiskChart from "../../components/terminal/RiskChart";
import { useNetwork } from "../../context/NetworkContext";
import { ShieldAlert, ArrowUpRight, Activity, Cpu } from "lucide-react";

export default function Overview() {
  const { currentThreat, forecast, riskAssessment } = useNetwork();

  const currentRisk = riskAssessment?.current_risk ?? currentThreat?.current_risk ?? 35;
  const futureRisk = riskAssessment?.future_risk ?? forecast?.future_risk ?? 72;
  const attackStage = forecast?.predicted_stage ?? currentThreat?.current_attack ?? "Lateral Movement";
  const confidence = forecast?.confidence ?? 87;

  return (
    <TerminalLayout title="Command Center Overview">
      <div className="space-y-6">
        {/* Top KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard title="CURRENT RISK" value={`${currentRisk} /100`} color={currentRisk > 60 ? "red" : "amber"} subtext="Observed window" />
          <MetricCard title="FUTURE RISK" value={`${futureRisk} /100`} color={futureRisk > 70 ? "red" : "amber"} subtext="Predicted T+5" trend="+37%" />
          <MetricCard title="ATTACK STAGE" value={attackStage} color="purple" subtext="Stage 4 of 6" />
          <MetricCard title="CONFIDENCE" value={`${confidence}%`} color="emerald" subtext="High probability" />
          <MetricCard title="ACTIVE THREATS" value="6" color="red" trend="+2 vs hour" />
          <MetricCard title="SUSPICIOUS HOSTS" value="23" color="amber" trend="+5 vs hour" />
        </div>

        {/* Main Chart + Top Risk Drivers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                  Network Risk Over Time
                </h3>
                <p className="text-[11px] font-mono text-slate-500">Observed Risk → NOW → Forecast Risk</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Observed
                </span>
                <span className="flex items-center gap-1.5 text-red-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Forecast
                </span>
              </div>
            </div>
            <RiskChart />
          </div>

          {/* Top Risk Drivers */}
          <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm space-y-4">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
              Top Risk Drivers
            </h3>
            <div className="space-y-3 font-mono text-xs">
              {[
                { name: "Scan Activity", pct: 42, color: "bg-red-500" },
                { name: "Host Fan-out", pct: 28, color: "bg-amber-500" },
                { name: "Unusual Ports", pct: 17, color: "bg-amber-400" },
                { name: "Traffic Volume", pct: 8, color: "bg-emerald-500" },
                { name: "Failed Logins", pct: 5, color: "bg-emerald-400" },
              ].map((d) => (
                <div key={d.name} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-300">{d.name}</span>
                    <span className="text-slate-400">+{d.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#161f30] rounded-full overflow-hidden">
                    <div className={`h-full ${d.color}`} style={{ width: `${d.pct * 2}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm">
            <div className="text-[11px] font-mono font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" /> Current Threat
            </div>
            <div className="text-sm font-bold text-red-400 font-mono">Port Scan Activity</div>
            <div className="text-xs text-slate-400 mt-1 font-mono">Multiple hosts are scanning an unusual number of ports.</div>
          </div>

          <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm">
            <div className="text-[11px] font-mono font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Future Forecast
            </div>
            <div className="text-sm font-bold text-amber-400 font-mono">Increasing Risk (72% in next 60m)</div>
            <div className="text-xs text-slate-400 mt-1 font-mono">High probability of lateral movement and further exploration.</div>
          </div>

          <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm">
            <div className="text-[11px] font-mono font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" /> Network State
            </div>
            <div className="text-sm font-bold text-emerald-400 font-mono">Active & Monitoring</div>
            <div className="text-xs text-slate-400 mt-1 font-mono">23 suspicious hosts continuously analyzed by temporal model.</div>
          </div>
        </div>
      </div>
    </TerminalLayout>
  );
}
