import TerminalLayout from "../../layouts/TerminalLayout";
import { useNetwork } from "../../context/NetworkContext";
import { CheckCircle2, AlertCircle, Clock, ArrowRight } from "lucide-react";

export default function AttackProgression() {
  const { timeline } = useNetwork();

  const stages = [
    { name: "Reconnaissance", status: "Observed", risk: 20, color: "bg-emerald-500 border-emerald-400 text-emerald-400" },
    { name: "Initial Access", status: "Observed", risk: 35, color: "bg-emerald-500 border-emerald-400 text-emerald-400" },
    { name: "Persistence", status: "Observed", risk: 48, color: "bg-emerald-500 border-emerald-400 text-emerald-400" },
    { name: "Lateral Movement", status: "Current Stage", risk: 68, color: "bg-amber-500 border-amber-400 text-amber-400 animate-pulse" },
    { name: "Command & Control", status: "Predicted", risk: 78, color: "bg-red-500/20 border-red-500 text-red-400" },
    { name: "Exfiltration", status: "Predicted", risk: 85, color: "bg-red-500/20 border-red-500 text-red-400" },
  ];

  return (
    <TerminalLayout title="Attack Progression Timeline">
      <div className="space-y-6 font-mono">
        {/* Stage Progression Flow */}
        <div className="bg-[#FAF2CA] border border-[#1a2333] p-6 rounded-sm">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-6">
            Cyber Kill-Chain Progression Map
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 relative">
            {stages.map((stg, i) => (
              <div key={stg.name} className="flex flex-col items-center text-center space-y-3 relative z-10">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm bg-[#080c14] ${stg.color}`}>
                  {i + 1}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">{stg.name}</div>
                  <div className={`text-[10px] mt-1 uppercase font-semibold ${
                    stg.status === "Current Stage" ? "text-amber-400" :
                    stg.status === "Observed" ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {stg.status}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Risk: {stg.risk}/100</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Progression Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#FAF2CA] border border-[#1a2333] p-5 rounded-sm space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Current Stage Details</h3>
            <div className="bg-[#080c14] p-4 border border-amber-900/50 rounded-sm">
              <div className="text-sm font-bold text-amber-400">Lateral Movement</div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Observed port scanning fanout across 23 internal destination IPs. Host 192.168.1.10 initiated SMB connection attempts.
              </p>
              <div className="mt-3 flex justify-between text-[11px] text-slate-400 pt-2 border-t border-[#1a2333]">
                <span>Risk Score: <strong className="text-amber-400">68 / 100</strong></span>
                <span>Observed Windows: <strong>10</strong></span>
              </div>
            </div>
          </div>

          <div className="bg-[#FAF2CA] border border-[#1a2333] p-5 rounded-sm space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Next Predicted Stage</h3>
            <div className="bg-[#080c14] p-4 border border-red-900/50 rounded-sm">
              <div className="text-sm font-bold text-red-400">Command & Control</div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                LSTM network predicts 87% probability of establishing C2 beaconing to external IP within 30-60 minutes.
              </p>
              <div className="mt-3 flex justify-between text-[11px] text-slate-400 pt-2 border-t border-[#1a2333]">
                <span>ETA: <strong className="text-red-400">30-60 mins</strong></span>
                <span>Forecasted Risk: <strong className="text-red-400">72 / 100</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TerminalLayout>
  );
}
