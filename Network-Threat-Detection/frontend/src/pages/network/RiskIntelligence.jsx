import TerminalLayout from "../../layouts/TerminalLayout";
import MetricCard from "../../components/terminal/MetricCard";
import RiskChart from "../../components/terminal/RiskChart";
import { useNetwork } from "../../context/NetworkContext";
import { Gauge, Info } from "lucide-react";

export default function RiskIntelligence() {
  const { riskAssessment, riskTimeline } = useNetwork();

  const overallRisk = riskAssessment?.overall_risk_score ?? 72;
  const level = riskAssessment?.risk_level ?? "HIGH";
  const explanation = riskAssessment?.explanation ?? "Risk is currently HIGH at 72/100. Forecast models predict risk will increase to 85/100 in the next 5 time windows due to elevated port scanning activity.";

  const components = riskAssessment?.components ?? {
    current_threat: 35,
    temporal: 40,
    host: 30,
    attack_stage: 45,
    anomaly: 25,
  };

  const chartData = riskTimeline?.chart && riskTimeline.chart.length > 0
    ? riskTimeline.chart
    : riskAssessment?.risk_trend && riskAssessment.risk_trend.length > 0
    ? riskAssessment.risk_trend.map((r) => ({
        time: r.timestamp,
        observed: r.risk,
      }))
    : [];

  return (
    <TerminalLayout title="Threat Risk Intelligence">
      <div className="space-y-6 font-mono">
        {/* Gauge + Risk Level Header */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0d121f] border border-red-900/50 p-5 rounded-sm flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-red-500 flex items-center justify-center text-red-400 font-bold text-2xl">
              {overallRisk}
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">OVERALL SECURITY RISK</div>
              <div className="text-lg font-bold text-red-400 tracking-wider uppercase">{level} RISK</div>
              <div className="text-[10px] text-slate-400">Score Range: 61 - 80</div>
            </div>
          </div>

          <MetricCard title="CURRENT RISK" value={`${riskAssessment?.current_risk ?? 52}`} color="amber" subtext="Observed window score" />
          <MetricCard title="FORECASTED RISK" value={`${riskAssessment?.future_risk ?? 78}`} color="red" trend="+26 points" subtext="Predicted T+5 horizon" />
          <MetricCard title="FORMULA MODEL" value="Composite Weighted" color="emerald" subtext="5-component blend" />
        </div>

        {/* Risk Breakdown + Trend Chart */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Components */}
          <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Risk Score Breakdown</h3>
            <div className="space-y-3 text-xs">
              {Object.entries(components).map(([k, v]) => (
                <div key={k} className="bg-[#080c14] p-3 border border-[#1a2333] flex justify-between items-center">
                  <span className="text-slate-300 uppercase text-[11px]">{k.replace("_", " ")}</span>
                  <span className="text-amber-400 font-bold">{v} / 100</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Trend Chart */}
          <div className="md:col-span-2 bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Composite Risk Trend over Time</h3>
            <RiskChart data={chartData} height={220} />
          </div>
        </div>

        {/* AI Risk Explanation */}
        <div className="bg-[#0d121f] border border-orange-900/50 p-4 rounded-sm space-y-2">
          <h3 className="text-xs font-bold uppercase text-orange-400 tracking-wider flex items-center gap-2">
            <Info className="w-4 h-4" /> AI Risk Decision Explanation
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {explanation}
          </p>
        </div>
      </div>
    </TerminalLayout>
  );
}
