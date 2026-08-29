import TerminalLayout from "../../layouts/TerminalLayout";
import MetricCard from "../../components/terminal/MetricCard";
import RiskChart from "../../components/terminal/RiskChart";
import { useNetwork } from "../../context/NetworkContext";
import { TrendingUp, AlertTriangle } from "lucide-react";

export default function AttackForecast() {
  const { forecast } = useNetwork();

  const futureRisk = forecast?.future_risk ?? 68;
  const stage = forecast?.predicted_stage ?? "Command & Control";
  const confidence = forecast?.confidence ?? 87;
  const model = forecast?.model ?? "LSTM World Model v1.0";

  const steps = [
    { step: "T+1 (+15m)", risk: 45, stage: "Lateral Movement", level: "Medium", color: "text-amber-400 border-amber-800 bg-amber-950/30" },
    { step: "T+2 (+30m)", risk: 56, stage: "Command & Control", level: "Medium", color: "text-amber-400 border-amber-800 bg-amber-950/30" },
    { step: "T+3 (+45m)", risk: 64, stage: "Command & Control", level: "High", color: "text-orange-400 border-orange-800 bg-orange-950/30" },
    { step: "T+4 (+60m)", risk: 68, stage: "Exfiltration", level: "Critical", color: "text-red-400 border-red-800 bg-red-950/30" },
  ];

  return (
    <TerminalLayout title="LSTM Future Attack Forecasting">
      <div className="space-y-6 font-mono">
        {/* Top Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0d121f] border border-red-900/50 p-5 rounded-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 uppercase">FUTURE ATTACK RISK</div>
              <div className="text-3xl font-bold text-red-400 mt-1">{futureRisk} <span className="text-sm font-normal text-slate-500">/ 100</span></div>
              <div className="text-[10px] text-red-400 uppercase mt-1">High Risk Threshold Exceeded</div>
            </div>
            <TrendingUp className="w-8 h-8 text-red-400" />
          </div>

          <MetricCard title="PREDICTION HORIZON" value="60 mins" color="blue" subtext="5 sequence steps" />
          <MetricCard title="PREDICTED STAGE" value={stage} color="purple" subtext="Next likely progression" />
          <MetricCard title="FORECAST MODEL" value={model} color="emerald" subtext={`${confidence}% Confidence`} />
        </div>

        {/* Main Forecast Chart */}
        <div className="bg-[#0d121f] border border-[#1a2333] p-5 rounded-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider">
                Risk Forecast Simulation (Observed vs Predicted)
              </h3>
              <p className="text-[11px] text-slate-500">Includes uncertainty bounds based on temporal state vectors</p>
            </div>
          </div>
          <RiskChart height={260} />
        </div>

        {/* Step-by-Step Predictions */}
        <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
            K-Step Forward Simulation Timeline
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {steps.map((s) => (
              <div key={s.step} className={`p-4 border rounded-sm ${s.color}`}>
                <div className="flex justify-between text-xs font-bold">
                  <span>{s.step}</span>
                  <span>{s.risk} / 100</span>
                </div>
                <div className="text-sm font-bold mt-2 text-slate-200">{s.stage}</div>
                <div className="text-[10px] uppercase tracking-wider mt-1">{s.level} Risk</div>
              </div>
            ))}
          </div>
        </div>

        {/* Driver / Explanation */}
        <div className="bg-[#0d121f] border border-amber-900/40 p-4 rounded-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold uppercase text-amber-400">Why is risk increasing?</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              The model detected a sustained increase in scan activity (+57%) and host fan-out (+21%), which typically precedes lateral movement and command-and-control establishment.
            </p>
          </div>
        </div>
      </div>
    </TerminalLayout>
  );
}
