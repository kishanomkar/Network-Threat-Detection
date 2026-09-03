import TerminalLayout from "../../layouts/TerminalLayout";
import MetricCard from "../../components/terminal/MetricCard";
import { useNetwork } from "../../context/NetworkContext";
import { ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function CurrentThreats() {
  const { currentThreat } = useNetwork();

  const threatStatus = currentThreat?.current_status ?? "SUSPICIOUS";
  const threatAttack = currentThreat?.current_attack ?? "Port Scan Activity";
  const riskScore = currentThreat?.current_risk ?? 35;
  const confidence = currentThreat?.confidence ?? 85;

  const categories = [
    { name: "DDoS", count: 2, level: "Low", color: "text-emerald-400 border-emerald-500/20" },
    { name: "Port Scan", count: 3, level: "Medium", color: "text-amber-400 border-amber-500/20" },
    { name: "C2 Beaconing", count: 1, level: "High", color: "text-red-400 border-red-500/20" },
    { name: "Exfiltration", count: 0, level: "None", color: "text-slate-500 border-slate-700" },
    { name: "Anomaly", count: 4, level: "Medium", color: "text-amber-400 border-amber-500/20" },
  ];

  const evidence = currentThreat?.evidence ?? [
    "Multiple hosts scanning 100+ ports",
    "Unusual connection to external IPs",
    "High number of failed login attempts",
    "Beaconing pattern detected to 192.168.1.10",
  ];

  return (
    <TerminalLayout title="Current Threats Monitoring">
      <div className="space-y-6 font-mono">
        {/* Main Status Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0d121f] border border-[#1a2333] p-5 rounded-sm flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xl">
              {riskScore}
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase">Overall Threat Risk</div>
              <div className="text-base font-bold text-amber-400 tracking-wide uppercase">{threatStatus}</div>
              <div className="text-[11px] text-slate-500">Medium Risk Band (31-60)</div>
            </div>
          </div>

          <MetricCard title="ACTIVE ATTACK TYPE" value={threatAttack} color="amber" subtext="Primary classification" />
          <MetricCard title="SEVERITY LEVEL" value="HIGH" color="red" subtext="Escalating fanout" />
          <MetricCard title="CLASSIFIER CONFIDENCE" value={`${confidence}%`} color="emerald" subtext="ANTCM Ensemble" />
        </div>

        {/* Threat Breakdown Grid */}
        <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4">
            Threat Category Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {categories.map((cat) => (
              <div key={cat.name} className={`bg-[#080c14] border p-3 rounded-sm ${cat.color}`}>
                <div className="text-[11px] text-slate-400 uppercase">{cat.name}</div>
                <div className="text-xl font-bold my-1">{cat.count}</div>
                <div className="text-[10px] uppercase tracking-wider">{cat.level}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Network Stats & Evidence Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Network Traffic Indicators
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#080c14] p-3 border border-[#1a2333]">
                <span className="text-slate-500 block text-[10px]">TOTAL FLOWS</span>
                <span className="text-slate-200 font-bold text-sm">12,543</span>
              </div>
              <div className="bg-[#080c14] p-3 border border-[#1a2333]">
                <span className="text-slate-500 block text-[10px]">TOTAL PACKETS</span>
                <span className="text-slate-200 font-bold text-sm">8.2M</span>
              </div>
              <div className="bg-[#080c14] p-3 border border-[#1a2333]">
                <span className="text-slate-500 block text-[10px]">UNIQUE HOSTS</span>
                <span className="text-slate-200 font-bold text-sm">124</span>
              </div>
              <div className="bg-[#080c14] p-3 border border-[#1a2333]">
                <span className="text-slate-500 block text-[10px]">SYN RATE</span>
                <span className="text-amber-400 font-bold text-sm">45.2%</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Active Threat Evidence
            </h3>
            <div className="space-y-2 text-xs">
              {evidence.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-[#080c14] p-2.5 border border-[#1a2333] text-slate-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </TerminalLayout>
  );
}
