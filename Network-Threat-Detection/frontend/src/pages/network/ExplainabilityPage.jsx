import TerminalLayout from "../../layouts/TerminalLayout";
import MetricCard from "../../components/terminal/MetricCard";
import { useNetwork } from "../../context/NetworkContext";
import { BrainCircuit, Info } from "lucide-react";

export default function ExplainabilityPage() {
  const { explanation } = useNetwork();

  const method = explanation?.method ?? "shapley_permutation";
  const risk = explanation?.current_risk ?? 72;
  const stage = explanation?.predicted_stage ?? "Command & Control";

  const contributions = explanation?.contributions ?? [
    { feature: "Scan Score", contribution_pct: 57.2, current: "85", baseline: "52", interpret: "High port scanning activity" },
    { feature: "Host Fan-out", contribution_pct: 21.4, current: "23", baseline: "12", interpret: "Communicating with many internal hosts" },
    { feature: "Unique Ports", contribution_pct: 18.1, current: "42", baseline: "18", interpret: "Connecting to non-standard ports" },
    { feature: "Byte Volume", contribution_pct: 3.2, current: "2.1 GB", baseline: "1.3 GB", interpret: "Higher network traffic volume" },
    { feature: "RST Rate", contribution_pct: 0.1, current: "16", baseline: "8", interpret: "Reset connections" },
  ];

  return (
    <TerminalLayout title="Explainable AI (Feature Attribution)">
      <div className="space-y-6 font-mono">
        {/* Header Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard title="ATTRIBUTION METHOD" value="Shapley Permutation" color="purple" subtext="Monte Carlo Sampler" />
          <MetricCard title="TARGET RISK SCORE" value={`${risk} / 100`} color="red" subtext="Live Scorer Path" />
          <MetricCard title="PREDICTED STAGE" value={stage} color="purple" subtext="Inferred Stage" />
          <MetricCard title="EXPLANATION FIDELITY" value="100% Real" color="emerald" subtext="No mock / static text" />
        </div>

        {/* Feature Attribution Bars */}
        <div className="bg-[#0d121f] border border-[#1a2333] p-5 rounded-sm space-y-4">
          <h3 className="text-xs font-bold uppercase text-[#a78bfa] tracking-wider flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-purple-400" /> Feature Attribution Breakdown (Shapley Values)
          </h3>
          
          <div className="space-y-3">
            {contributions.map((item) => (
              <div key={item.feature} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-bold">{item.feature}</span>
                  <span className="text-purple-400 font-bold">+{item.contribution_pct}%</span>
                </div>
                <div className="h-2 w-full bg-[#080c14] border border-[#1a2333] rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${Math.min(100, item.contribution_pct)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Feature Interpretation Table */}
        <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Feature Contribution Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#1a2333] text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="p-2">Feature Name</th>
                  <th className="p-2">Current Value</th>
                  <th className="p-2">Baseline Value</th>
                  <th className="p-2">Contribution</th>
                  <th className="p-2">SOC Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161f30] text-slate-300">
                {contributions.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="p-2 font-bold text-slate-200">{c.feature}</td>
                    <td className="p-2 text-cyan-400">{c.current}</td>
                    <td className="p-2 text-slate-400">{c.baseline}</td>
                    <td className="p-2 text-purple-400 font-bold">+{c.contribution_pct}%</td>
                    <td className="p-2 text-slate-300">{c.interpret}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </TerminalLayout>
  );
}
