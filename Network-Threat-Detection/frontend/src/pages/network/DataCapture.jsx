import TerminalLayout from "../../layouts/TerminalLayout";
import { useNetwork } from "../../context/NetworkContext";
import { UploadCloud, Play, FileText, CheckCircle2 } from "lucide-react";

export default function DataCapture() {
  const { path, setPath, dataset, setDataset, analyzing, runFullAnalysis, lastAnalysis } = useNetwork();

  return (
    <TerminalLayout title="Data Pipeline & PCAP Capture Manager">
      <div className="space-y-6 font-mono">
        {/* Upload Zone */}
        <div className="bg-[#0d121f] border-2 border-dashed border-[#1a2333] hover:border-cyan-500/50 p-8 rounded-sm text-center space-y-3 transition">
          <UploadCloud className="w-10 h-10 text-cyan-400 mx-auto" />
          <div className="text-sm font-bold text-slate-200">Drag & Drop PCAP or CSV network traffic captures here</div>
          <div className="text-xs text-slate-500">Supports .pcap, .pcapng, .csv files up to 500MB</div>
          <div className="pt-2">
            <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 text-xs font-bold rounded border border-slate-700">
              Browse Local Files
            </button>
          </div>
        </div>

        {/* Current Selected Capture */}
        <div className="bg-[#0d121f] border border-[#1a2333] p-5 rounded-sm space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Active Capture Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Capture Path / Filename</label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="w-full bg-[#080c14] border border-[#1a2333] p-2.5 text-xs text-slate-200 font-mono outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">Dataset Adapter Mode</label>
              <select
                value={dataset}
                onChange={(e) => setDataset(e.target.value)}
                className="w-full bg-[#080c14] border border-[#1a2333] p-2.5 text-xs text-slate-200 font-mono outline-none"
              >
                <option value="PCAP">PCAP Packet Capture</option>
                <option value="Generic CSV">Generic Flow CSV</option>
                <option value="CICIDS2017">CICIDS-2017 Format</option>
              </select>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2">
            <button
              onClick={runFullAnalysis}
              disabled={analyzing}
              className="w-full md:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-6 py-3 text-sm font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              {analyzing ? "RUNNING NETWORK ANALYSIS..." : "RUN FULL NETWORK ANALYSIS"}
            </button>
          </div>
        </div>

        {/* Loaded Dataset Metadata */}
        <div className="bg-[#0d121f] border border-[#1a2333] p-5 rounded-sm space-y-3">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Loaded Capture Metadata</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
            <div className="bg-[#080c14] p-3 border border-[#1a2333]">
              <span className="text-slate-500 text-[10px] block">FILE SIZE</span>
              <span className="text-slate-200 font-bold">128.4 MB</span>
            </div>
            <div className="bg-[#080c14] p-3 border border-[#1a2333]">
              <span className="text-slate-500 text-[10px] block">DURATION</span>
              <span className="text-slate-200 font-bold">02:30:15</span>
            </div>
            <div className="bg-[#080c14] p-3 border border-[#1a2333]">
              <span className="text-slate-500 text-[10px] block">PACKETS</span>
              <span className="text-slate-200 font-bold">1,234,567</span>
            </div>
            <div className="bg-[#080c14] p-3 border border-[#1a2333]">
              <span className="text-slate-500 text-[10px] block">FLOWS</span>
              <span className="text-slate-200 font-bold">45,678</span>
            </div>
            <div className="bg-[#080c14] p-3 border border-[#1a2333]">
              <span className="text-slate-500 text-[10px] block">HOSTS</span>
              <span className="text-slate-200 font-bold">124</span>
            </div>
            <div className="bg-[#080c14] p-3 border border-[#1a2333]">
              <span className="text-slate-500 text-[10px] block">PROTOCOLS</span>
              <span className="text-slate-200 font-bold">5</span>
            </div>
          </div>
        </div>
      </div>
    </TerminalLayout>
  );
}
