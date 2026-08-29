import TerminalLayout from "../../layouts/TerminalLayout";
import MetricCard from "../../components/terminal/MetricCard";
import RiskChart from "../../components/terminal/RiskChart";
import { useNetwork } from "../../context/NetworkContext";
import { ShieldAlert, ArrowUpRight, Activity, Cpu } from "lucide-react";

export default function Overview() {
  const { currentThreat, forecast, riskAssessment, riskTimeline } = useNetwork();

  /* ---- Pull values from the dynamic riskTimeline first, then fall back to
     other context slices, and only use a placeholder as last resort ---- */
  const tl = riskTimeline || {};

  const currentRisk  = tl.current_risk  ?? riskAssessment?.current_risk ?? currentThreat?.current_risk ?? "--";
  const futureRisk   = tl.future_risk   ?? riskAssessment?.future_risk  ?? forecast?.future_risk       ?? "--";
  const attackStage  = tl.current_stage  ?? forecast?.predicted_stage   ?? currentThreat?.current_attack ?? "--";
  const predictedStage = tl.predicted_stage ?? forecast?.predicted_stage ?? "--";
  const confidence   = tl.confidence     ?? forecast?.confidence        ?? "--";
  const activeHosts  = tl.active_hosts   ?? "--";
  const suspPorts    = tl.suspicious_ports ?? "--";

  // Chart data from /api/risk/timeline – the exact shape RiskChart expects
  const chartData = tl.chart ?? [];

  // Drivers from actual PCAP analysis
  const drivers = (tl.drivers ?? []).length > 0
    ? tl.drivers
    : [
        { name: "Scan Activity", pct: 0 },
        { name: "Beacon Score", pct: 0 },
        { name: "Exfiltration", pct: 0 },
        { name: "Host Fan-out", pct: 0 },
        { name: "Port Fan-out", pct: 0 },
      ];

  const driverColors = [
    "bg-red-500",
    "bg-amber-500",
    "bg-amber-400",
    "bg-emerald-500",
    "bg-emerald-400",
  ];

  // Determine dynamic descriptions for the summary cards
  const threatDesc = currentRisk !== "--"
    ? `Risk ${currentRisk}/100 — ${attackStage}`
    : "Run analysis to see current threats";
  const forecastDesc = futureRisk !== "--"
    ? `${futureRisk > currentRisk ? "Increasing" : futureRisk < currentRisk ? "Decreasing" : "Steady"} Risk (${futureRisk}% forecast)`
    : "Run analysis to see forecast";
  const stateDesc = activeHosts !== "--"
    ? `${activeHosts} hosts, ${suspPorts} port fan-out observed`
    : "Run analysis to see network state";

  return (
    <TerminalLayout title="Command Center Overview">
      <div className="space-y-6">
        {/* Top KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard title="CURRENT RISK" value={currentRisk !== "--" ? `${currentRisk} /100` : "--"} color={currentRisk > 60 ? "red" : "amber"} subtext="Observed window" />
          <MetricCard title="FUTURE RISK" value={futureRisk !== "--" ? `${futureRisk} /100` : "--"} color={futureRisk > 70 ? "red" : "amber"} subtext="Predicted T+5" trend={futureRisk !== "--" && currentRisk !== "--" ? `${futureRisk > currentRisk ? "+" : ""}${futureRisk - currentRisk}%` : undefined} />
          <MetricCard title="ATTACK STAGE" value={attackStage} color="purple" subtext={predictedStage !== "--" ? `Predicted → ${predictedStage}` : ""} />
          <MetricCard title="CONFIDENCE" value={confidence !== "--" ? `${confidence}%` : "--"} color="emerald" subtext={confidence !== "--" ? (confidence >= 80 ? "High probability" : "Moderate") : ""} />
          <MetricCard title="HOST FAN-OUT" value={activeHosts !== "--" ? String(activeHosts) : "--"} color="red" />
          <MetricCard title="PORT FAN-OUT" value={suspPorts !== "--" ? String(suspPorts) : "--"} color="amber" />
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
            <RiskChart data={chartData} />
          </div>

          {/* Top Risk Drivers — now dynamic */}
          <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm space-y-4">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
              Top Risk Drivers
            </h3>
            <div className="space-y-3 font-mono text-xs">
              {drivers.map((d, i) => (
                <div key={d.name} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-300">{d.name}</span>
                    <span className="text-slate-400">{d.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#161f30] rounded-full overflow-hidden">
                    <div className={`h-full ${driverColors[i % driverColors.length]}`} style={{ width: `${Math.min(d.pct, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Summary Grid — now dynamic */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm">
            <div className="text-[11px] font-mono font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" /> Current Threat
            </div>
            <div className="text-sm font-bold text-red-400 font-mono">{attackStage}</div>
            <div className="text-xs text-slate-400 mt-1 font-mono">{threatDesc}</div>
          </div>

          <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm">
            <div className="text-[11px] font-mono font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Future Forecast
            </div>
            <div className="text-sm font-bold text-amber-400 font-mono">{forecastDesc}</div>
            <div className="text-xs text-slate-400 mt-1 font-mono">Predicted stage: {predictedStage}</div>
          </div>

          <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm">
            <div className="text-[11px] font-mono font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" /> Network State
            </div>
            <div className="text-sm font-bold text-emerald-400 font-mono">
              {riskTimeline ? "Active & Monitoring" : "Waiting for Analysis"}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono">{stateDesc}</div>
          </div>
        </div>
      </div>
    </TerminalLayout>
  );
}
