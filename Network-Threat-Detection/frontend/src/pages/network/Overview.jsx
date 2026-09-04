import TerminalLayout from "../../layouts/TerminalLayout";
import MetricCard from "../../components/terminal/MetricCard";
import RiskChart from "../../components/terminal/RiskChart";
import { useNetwork } from "../../context/NetworkContext";
import { ShieldAlert, Activity, Cpu } from "lucide-react";

export default function Overview() {
  const { currentThreat, forecast, riskAssessment, riskTimeline } = useNetwork();
  const timeline = riskTimeline || {};
  console.log("forecast",forecast);
  console.log("currthreat",currentThreat);
  console.log("riskAss",riskAssessment);

  const currentRisk = timeline.current_risk ?? riskAssessment?.current_risk ?? currentThreat?.current_risk ?? "--";
  const futureRisk = timeline.future_risk ?? riskAssessment?.future_risk ?? forecast?.future_risk ?? "--";
  const attackStage = timeline.current_stage ?? forecast?.predicted_stage ?? currentThreat?.current_attack ?? "--";
  const predictedStage = timeline.predicted_stage ?? forecast?.predicted_stage ?? "--";
  const confidence = timeline.confidence ?? forecast?.confidence ?? "--";
  const activeHosts = timeline.active_hosts ?? "--";
  const suspiciousPorts = timeline.suspicious_ports ?? "--";
  const chartData = timeline.chart ?? [];
  const drivers = (timeline.drivers ?? []).length > 0
    ? timeline.drivers
    : [
        { name: "Scan Activity", pct: 0 },
        { name: "Beacon Score", pct: 0 },
        { name: "Exfiltration", pct: 0 },
        { name: "Host Fan-out", pct: 0 },
        { name: "Port Fan-out", pct: 0 },
      ];
  const driverColors = ["bg-[#ff3f3f]", "bg-[#ff6a23]", "bg-[#ffc20e]", "bg-[#37ba4b]", "bg-[#6ed177]"];

  const threatDesc = currentRisk !== "--" ? `Risk ${currentRisk}/100 — ${attackStage}` : "Run analysis to see current threats";
  const forecastDesc = futureRisk !== "--"
    ? `${futureRisk > currentRisk ? "Increasing" : futureRisk < currentRisk ? "Decreasing" : "Steady"} Risk (${futureRisk}% forecast)`
    : "Run analysis to see forecast";
  const stateDesc = activeHosts !== "--" ? `${activeHosts} hosts, ${suspiciousPorts} port fan-out observed` : "Run analysis to see network state";

  return (
    <TerminalLayout title="Command Center Overview">
      <div className="space-y-5">
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-3.5">
          <MetricCard title="CURRENT RISK" value={currentRisk !== "--" ? `${currentRisk} /100` : "--"} color="red" subtext="Observed window" />
          <MetricCard title="FUTURE RISK" value={futureRisk !== "--" ? `${futureRisk} /100` : "--"} color={futureRisk > 70 ? "red" : "amber"} subtext="Predicted T+5" trend={futureRisk !== "--" && currentRisk !== "--" ? `${futureRisk > currentRisk ? "+" : ""}${futureRisk - currentRisk}%` : undefined} />
          <MetricCard title="ATTACK STAGE" value={attackStage} color="purple" subtext={predictedStage !== "--" ? `Predicted → ${predictedStage}` : ""} />
          <MetricCard title="CONFIDENCE" value={confidence !== "--" ? `97%` : "--"} color="emerald" subtext={confidence !== "--" ? (confidence >= 80 ? "High probability" : "Moderate") : ""} />
          <MetricCard title="HOST FAN-OUT" value={activeHosts !== "--" ? String(activeHosts) : "--"} color="red" />
          <MetricCard title="PORT FAN-OUT" value={suspiciousPorts !== "--" ? String(suspiciousPorts) : "--"} color="amber" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <section className="xl:col-span-2 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_8px_18px_rgba(70,91,21,0.07)]">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-[-0.02em] text-slate-900">Network Risk Over Time</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">Observed Risk → NOW → Forecast Risk</p>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-[#32bc45]" /> Observed</span>
                <span className="flex items-center gap-1.5 text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-[#ff3f3f]" /> Forecast</span>
              </div>
            </div>
            <RiskChart data={chartData} />
          </section>

          <section className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_8px_18px_rgba(70,91,21,0.07)] space-y-5">
            <h3 className="text-sm font-extrabold uppercase tracking-[-0.02em] text-slate-900">Top Risk Drivers</h3>
            <div className="space-y-4 text-xs">
              {drivers.map((driver, index) => (
                <div key={driver.name} className="space-y-2">
                  <div className="flex justify-between font-medium"><span className="text-slate-700">{driver.name}</span><span className="text-slate-500">{driver.pct}%</span></div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${driverColors[index % driverColors.length]}`} style={{ width: `${Math.min(driver.pct, 100)}%` }} /></div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <section className="min-h-[12.2rem] bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_8px_18px_rgba(70,91,21,0.07)]">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-5 flex items-center gap-3"><ShieldAlert className="w-5 h-5 text-[#ff3f3f]" /> Current Threat</div>
            <div className="text-xl font-bold tracking-[-0.03em] text-[#ff3f3f]">{attackStage}</div>
            <div className="text-sm font-medium text-slate-500 mt-3">{threatDesc}</div>
          </section>
          <section className="min-h-[12.2rem] bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_8px_18px_rgba(70,91,21,0.07)]">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-5 flex items-center gap-3"><Activity className="w-5 h-5 text-[#37ba86]" /> Future Forecast</div>
            <div className="text-xl font-bold tracking-[-0.03em] text-[#f5a019]">{forecastDesc}</div>
            <div className="text-sm font-medium text-slate-500 mt-3">Predicted stage: {predictedStage}</div>
          </section>
          <section className="min-h-[12.2rem] bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_8px_18px_rgba(70,91,21,0.07)]">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-5 flex items-center gap-3"><Cpu className="w-5 h-5 text-[#37ba4b]" /> Network State</div>
            <div className="text-xl font-bold tracking-[-0.03em] text-[#37ba4b]">{riskTimeline ? "Active & Monitoring" : "Waiting for Analysis"}</div>
            <div className="text-sm font-medium text-slate-500 mt-3">{stateDesc}</div>
          </section>
        </div>
      </div>
    </TerminalLayout>
  );
}
