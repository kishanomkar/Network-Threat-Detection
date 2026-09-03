import TerminalLayout from "../../layouts/TerminalLayout";
import { useNetwork } from "../../context/NetworkContext";
import { FileText, ShieldAlert, CheckSquare, AlertCircle } from "lucide-react";

export default function InvestigationPage() {
  const { investigation } = useNetwork();

  const caseId = investigation?.case_id ?? "INC-2026-00125";
  const priority = investigation?.priority ?? "HIGH";
  const riskScore = investigation?.risk_score ?? 72;
  const predictedStage = investigation?.predicted_stage ?? "Command & Control";

  const timelineEvents = [
    { time: "10:30:12", event: "Port scan detected scanning 100+ ports", level: "Warning" },
    { time: "11:15:45", event: "Unusual outbound connection attempts", level: "High" },
    { time: "12:00:10", event: "Lateral movement detected towards internal subnet", level: "Critical" },
    { time: "12:45:00", event: "Suspect C2 beaconing pattern identified", level: "Critical" },
  ];

  const suspects = investigation?.suspect_hosts ?? [
    { host: "192.168.1.10", risk: 85 },
    { host: "192.168.1.15", risk: 72 },
    { host: "190.51.100.20", risk: 65 },
  ];

  return (
    <TerminalLayout title="Threat Investigation Workspace">
      <div className="space-y-6 font-mono">
        {/* 3-Column Case View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT: Case Info */}
          <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" /> Case Information
            </h3>
            <div className="bg-[#080c14] p-3 border border-[#1a2333] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Case ID:</span>
                <span className="text-slate-200 font-bold">{caseId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Priority:</span>
                <span className="text-red-400 font-bold">{priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Risk Score:</span>
                <span className="text-amber-400 font-bold">{riskScore} / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Predicted Stage:</span>
                <span className="text-purple-400 font-bold">{predictedStage}</span>
              </div>
            </div>
          </div>

          {/* CENTER: Investigation Timeline */}
          <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Investigation Timeline</h3>
            <div className="space-y-2 text-xs">
              {timelineEvents.map((evt, idx) => (
                <div key={idx} className="bg-[#080c14] p-2.5 border border-[#1a2333] space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{evt.time}</span>
                    <span className={evt.level === "Critical" ? "text-red-400" : "text-amber-400"}>{evt.level}</span>
                  </div>
                  <div className="text-slate-300">{evt.event}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Suspect Entities */}
          <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Suspect Entities</h3>
            <div className="space-y-2 text-xs">
              {suspects.map((s, idx) => (
                <div key={idx} className="flex justify-between items-center bg-[#080c14] p-2.5 border border-[#1a2333]">
                  <span className="text-cyan-400 font-bold">{s.host}</span>
                  <span className="text-red-400 font-bold">{s.risk} / 100 Risk</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM: Recommended Actions */}
        <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm space-y-3">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-400" /> Recommended Analyst Response Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-[#080c14] p-3 border border-emerald-900/40 text-slate-300">
              <strong className="text-emerald-400 block mb-1">1. Isolate Host 192.168.1.10</strong>
              Apply SOC VLAN containment policy to mitigate further lateral scan spread.
            </div>
            <div className="bg-[#080c14] p-3 border border-emerald-900/40 text-slate-300">
              <strong className="text-emerald-400 block mb-1">2. Block External IP 190.51.100.20</strong>
              Add rule to border firewall blocking inbound/outbound C2 traffic.
            </div>
            <div className="bg-[#080c14] p-3 border border-emerald-900/40 text-slate-300">
              <strong className="text-emerald-400 block mb-1">3. Increase Logging Verbosity</strong>
              Enable detailed flow-level packet logging for internal subnet 192.168.1.0/24.
            </div>
          </div>
        </div>
      </div>
    </TerminalLayout>
  );
}
