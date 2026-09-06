import { useState } from "react";
import TerminalLayout from "../../layouts/TerminalLayout";
import FraudGraph3D from "../../components/FraudGraph3D";
import { useNetwork } from "../../context/NetworkContext";

export default function NetworkGraphPage() {
  const { networkGraph } = useNetwork();
  const [selectedNode, setSelectedNode] = useState(null);
  console.log("net",networkGraph);

  // Fallback demo graph if backend data not loaded
  const graphData = networkGraph?.graph || {
    nodes: [
      { id: "192.168.1.10", name: "192.168.1.10", risk: "CRITICAL", probability: 0.85, val: 12 },
      { id: "192.168.1.15", name: "192.168.1.15", risk: "HIGH", probability: 0.72, val: 8 },
      { id: "192.168.1.20", name: "192.168.1.20", risk: "MEDIUM", probability: 0.45, val: 6 },
      { id: "203.0.113.25", name: "203.0.113.25", risk: "HIGH", probability: 0.68, val: 9 },
      { id: "190.51.100.20", name: "190.51.100.20", risk: "CRITICAL", probability: 0.91, val: 15 },
    ],
    links: [
      { source: "192.168.1.10", target: "192.168.1.15", value: 5 },
      { source: "192.168.1.10", target: "203.0.113.25", value: 12 },
      { source: "192.168.1.15", target: "190.51.100.20", value: 8 },
      { source: "192.168.1.20", target: "192.168.1.10", value: 3 },
    ]
  };

  return (
    <TerminalLayout title="Network Behaviour Graph Topology">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 font-mono">
        {/* Main 3D Graph Visualization */}
        <div className="lg:col-span-3 bg-[#FAF2CA] border border-[#1a2333] p-4 rounded-sm h-[600px] relative">
          <FraudGraph3D
            graphData={graphData}
            onNodeSelect={setSelectedNode}
            title="Interactive Host Topology Graph"
            subtitle="Rotate, zoom, and select nodes to inspect host-to-host risk relationships."
          />
        </div>

        {/* Graph Details Sidebar */}
        <div className="bg-[#FAF2CA] border border-[#1a2333] p-4 rounded-sm space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Graph Metrics</h3>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#080c14] p-2.5 border border-[#1a2333]">
              <span className="text-slate-500 text-[10px] block">TOTAL HOSTS</span>
              <span className="text-slate-200 font-bold text-sm">124</span>
            </div>
            <div className="bg-[#080c14] p-2.5 border border-[#1a2333]">
              <span className="text-slate-500 text-[10px] block">CONNECTIONS</span>
              <span className="text-slate-200 font-bold text-sm">342</span>
            </div>
            <div className="bg-[#080c14] p-2.5 border border-[#1a2333]">
              <span className="text-slate-500 text-[10px] block">SUSPICIOUS HOSTS</span>
              <span className="text-amber-400 font-bold text-sm">23</span>
            </div>
            <div className="bg-[#080c14] p-2.5 border border-[#1a2333]">
              <span className="text-slate-500 text-[10px] block">CRITICAL HOSTS</span>
              <span className="text-red-400 font-bold text-sm">6</span>
            </div>
          </div>

          {/* Selected Node Details */}
          <div className="border-t border-[#1a2333] pt-4">
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">Selected Host Inspection</h4>
            {selectedNode ? (
              <div className="bg-[#080c14] border border-cyan-900/50 p-3 rounded-sm space-y-2 text-xs">
                <div>IP Address: <span className="text-cyan-400 font-bold">{selectedNode.name || selectedNode.id}</span></div>
                <div>Risk Level: <span className="text-red-400 font-bold">{selectedNode.risk || "HIGH"}</span></div>
                <div>Risk Probability: <span className="text-slate-200">{Math.round((selectedNode.probability || 0.75) * 100)}%</span></div>
                <div>Active Connections: <span className="text-slate-200">{selectedNode.val || 12}</span></div>
                <div className="text-[10px] text-slate-500 pt-2 border-t border-[#1a2333]">
                  Behavior: High port fanout detected, probable reconnaissance source.
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-3 bg-[#080c14] border border-[#1a2333] text-center">
                Click any node in the graph to inspect properties.
              </div>
            )}
          </div>
        </div>
      </div>
    </TerminalLayout>
  );
}
