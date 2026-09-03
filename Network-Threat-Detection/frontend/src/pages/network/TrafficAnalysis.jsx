import TerminalLayout from "../../layouts/TerminalLayout";
import MetricCard from "../../components/terminal/MetricCard";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

export default function TrafficAnalysis() {
  const protocolData = [
    { name: "TCP", value: 68, color: "#06b6d4" },
    { name: "UDP", value: 23, color: "#3b82f6" },
    { name: "ICMP", value: 7, color: "#f59e0b" },
    { name: "Others", value: 2, color: "#64748b" },
  ];

  const portData = [
    { port: "80", count: 2400 },
    { port: "443", count: 1800 },
    { port: "22", count: 950 },
    { port: "53", count: 620 },
    { port: "445", count: 410 },
    { port: "3389", count: 280 },
  ];

  const flows = [
    { time: "15:14:22", src: "192.168.1.10", dst: "203.0.113.25", proto: "TCP", port: 80, pkts: 512, bytes: "296 KB", risk: "Low" },
    { time: "15:14:21", src: "192.168.1.15", dst: "203.0.113.8", proto: "TCP", port: 443, pkts: 1034, bytes: "1.2 MB", risk: "Medium" },
    { time: "15:14:20", src: "192.168.1.9", dst: "192.168.1.1", proto: "UDP", port: 53, pkts: 76, bytes: "9 KB", risk: "Low" },
    { time: "15:14:19", src: "192.168.1.20", dst: "190.51.100.20", proto: "TCP", port: 22, pkts: 220, bytes: "415 KB", risk: "High" },
    { time: "15:14:18", src: "192.168.1.10", dst: "190.51.100.25", proto: "TCP", port: 445, pkts: 310, bytes: "78 KB", risk: "High" },
  ];

  return (
    <TerminalLayout title="Traffic & Flow Analytics Terminal">
      <div className="space-y-6 font-mono">
        {/* Metric Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard title="PACKETS / SEC" value="2,456" color="cyan" trend="+12%" subtext="1.2M Total" />
          <MetricCard title="BYTES / SEC" value="3.7 MB" color="blue" trend="+8%" subtext="850 MB Total" />
          <MetricCard title="FLOWS / SEC" value="312" color="emerald" trend="Normal" subtext="3,560 Active" />
          <MetricCard title="ACTIVE HOSTS" value="124" color="purple" trend="+6%" subtext="312 Ports" />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Protocol Distribution */}
          <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Protocol Distribution</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={protocolData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4}>
                    {protocolData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] mt-2">
              {protocolData.map((p) => (
                <div key={p.name} className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span>{p.name}: {p.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Destination Ports */}
          <div className="md:col-span-2 bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Top Destination Ports</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={portData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="port" stroke="#475569" fontSize={11} />
                  <YAxis stroke="#475569" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Flow Table */}
        <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Recent Network Flows</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#1a2333] text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="p-2">Time</th>
                  <th className="p-2">Source IP</th>
                  <th className="p-2">Destination IP</th>
                  <th className="p-2">Proto</th>
                  <th className="p-2">Port</th>
                  <th className="p-2">Packets</th>
                  <th className="p-2">Bytes</th>
                  <th className="p-2">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161f30] text-slate-300">
                {flows.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="p-2 text-slate-400">{f.time}</td>
                    <td className="p-2 text-cyan-400">{f.src}</td>
                    <td className="p-2 text-cyan-400">{f.dst}</td>
                    <td className="p-2">{f.proto}</td>
                    <td className="p-2">{f.port}</td>
                    <td className="p-2">{f.pkts}</td>
                    <td className="p-2">{f.bytes}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        f.risk === "High" ? "bg-red-950 text-red-400 border border-red-800" :
                        f.risk === "Medium" ? "bg-amber-950 text-amber-400 border border-amber-800" :
                        "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      }`}>
                        {f.risk}
                      </span>
                    </td>
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
