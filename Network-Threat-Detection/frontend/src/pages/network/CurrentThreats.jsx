import TerminalLayout from "../../layouts/TerminalLayout";
import MetricCard from "../../components/terminal/MetricCard";
import ThreatDetectionFlow from "../../components/terminal/ThreatDetectionFlow";
import { useNetwork } from "../../context/NetworkContext";
import { AlertTriangle } from "lucide-react";

const clampPercentage = (value, fallback) => {
  if (value == null || Number.isNaN(Number(value))) return fallback;
  const number = Number(value);
  return Math.max(0, Math.min(100, Math.round(number <= 1 ? number * 100 : number)));
};

const severityForRisk = (risk) => {
  if (risk >= 81) return "CRITICAL";
  if (risk >= 61) return "HIGH";
  if (risk >= 31) return "MEDIUM";
  return "LOW";
};

const severityTheme = {
  CRITICAL: { metric: "red", ring: "border-red-500/40", value: "text-red-500" },
  HIGH: { metric: "red", ring: "border-red-500/40", value: "text-red-500" },
  MEDIUM: { metric: "amber", ring: "border-amber-500/40", value: "text-amber-500" },
  LOW: { metric: "emerald", ring: "border-emerald-500/40", value: "text-emerald-500" },
};

export default function CurrentThreats() {
  const { currentThreat } = useNetwork();

  const threatStatus = currentThreat?.current_status ?? "SUSPICIOUS";
  const threatAttack = currentThreat?.current_attack ?? "Port Scan Activity";
  const riskScore = currentThreat?.current_risk ?? 35;
  const confidence = currentThreat?.confidence ?? 85;
  const severity = currentThreat?.current_risk_level ?? severityForRisk(riskScore);
  const currentTheme = severityTheme[severity] ?? severityTheme.MEDIUM;
  const latestState = currentThreat?.latest_state;

  const categorySignals = [
    { key: "dos", name: "DoS", signalLabel: "SYN flood indicators", score: clampPercentage(latestState?.syn_rate, 48), color: "#f97316", terms: ["dos", "ddos", "denial"] },
    { key: "port-scan", name: "Port Scan", signalLabel: "Port fan-out & scan score", score: clampPercentage(latestState?.scan_score, 72), color: "#f5a019", terms: ["port", "scan", "reconnaissance"] },
    { key: "c2", name: "C2 Beaconing", signalLabel: "Periodic beacon score", score: clampPercentage(latestState?.beacon_score, 37), color: "#8745e8", terms: ["beacon", "command and control", "c2"] },
    { key: "exfiltration", name: "Exfiltration", signalLabel: "Outbound transfer score", score: clampPercentage(latestState?.exfiltration_score, 18), color: "#3578f6", terms: ["exfiltration", "exfil"] },
    { key: "anomaly", name: "Anomaly", signalLabel: "Overall behavioral risk", score: clampPercentage(riskScore, 56), color: "#24b7be", terms: ["anomaly", "suspicious"] },
  ];

  const attackText = String(threatAttack).toLowerCase();
  const categories = categorySignals.map((category) => ({
    ...category,
    active: category.terms.some((term) => attackText.includes(term)),
  }));
  if (!categories.some((category) => category.active)) {
    categories[categories.length - 1].active = true;
  }

  const categoryCards = categories.map((category) => ({
    ...category,
    count: Math.max(0, Math.round(category.score / 25)),
    level: category.score >= 61 ? "High" : category.score >= 31 ? "Medium" : category.score > 0 ? "Low" : "None",
    color: category.score >= 61 ? "text-red-500 border-red-500/20" : category.score >= 31 ? "text-amber-500 border-amber-500/20" : "text-emerald-500 border-emerald-500/20",
  }));

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
          <div className="bg-[#FAF2CA] border border-[#1a2333] p-5 rounded-sm flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-bold text-xl ${currentTheme.ring} ${currentTheme.value}`}>
              {riskScore}
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase">Overall Threat Risk</div>
              <div className={`text-base font-bold tracking-wide uppercase ${currentTheme.value}`}>{threatStatus}</div>
              <div className="text-[11px] text-slate-500">{severity} Risk Band</div>
            </div>
          </div>

          <MetricCard title="ACTIVE ATTACK TYPE" value={threatAttack} color="amber" subtext="Primary classification" />
          <MetricCard title="SEVERITY LEVEL" value={severity} color={currentTheme.metric} subtext="Current risk assessment" />
          <MetricCard title="CLASSIFIER CONFIDENCE" value={`100%`} color="emerald" subtext="ANTCM Ensemble" />
        </div>

        <ThreatDetectionFlow attack={threatAttack} status={threatStatus} categories={categories} />

        {/* Threat Breakdown Grid */}
        <div className="bg-[#FAF2CA] border border-[#1a2333] p-4 rounded-sm">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4">
            Threat Category Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {categoryCards.map((cat) => (
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
          <div className="bg-[#FAF2CA] border border-[#1a2333] p-4 rounded-sm space-y-3">
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

          <div className="bg-[#FAF2CA] border border-[#1a2333] p-4 rounded-sm space-y-3">
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
