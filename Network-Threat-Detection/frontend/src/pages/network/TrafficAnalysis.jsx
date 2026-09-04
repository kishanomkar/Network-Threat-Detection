import TerminalLayout from "../../layouts/TerminalLayout";
import MetricCard from "../../components/terminal/MetricCard";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from "recharts";

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
    { time: "15:14:22", src: "192.168.1.10", dst: "203.0.113.25", proto: "TCP", port: 80, pkts: 512, bytes: "296 KB", risk: "Low", color: "#f97316", activity: [268, 332, 286, 454, 512] },
    { time: "15:14:21", src: "192.168.1.15", dst: "203.0.113.8", proto: "TCP", port: 443, pkts: 1034, bytes: "1.2 MB", risk: "Medium", color: "#eab308", activity: [540, 720, 650, 913, 1034] },
    { time: "15:14:20", src: "192.168.1.9", dst: "192.168.1.1", proto: "UDP", port: 53, pkts: 76, bytes: "9 KB", risk: "Low", color: "#8745e8", activity: [40, 84, 62, 91, 76] },
    { time: "15:14:19", src: "192.168.1.20", dst: "190.51.100.20", proto: "TCP", port: 22, pkts: 220, bytes: "415 KB", risk: "High", color: "#3578f6", activity: [91, 140, 188, 244, 220] },
    { time: "15:14:18", src: "192.168.1.10", dst: "190.51.100.25", proto: "TCP", port: 445, pkts: 310, bytes: "78 KB", risk: "High", color: "#24b7be", activity: [76, 148, 125, 290, 310] },
  ];

const flowChartData = [
  { time: "15:14:18",   flow1: 40,  flow2: 520, flow3: 18, flow4: 70,  flow5: 45 },

  { time: "15:14:18.15", flow1: 150, flow2: 570, flow3: 42, flow4: 105, flow5: 100 },
  { time: "15:14:18.30", flow1: 285, flow2: 640, flow3: 68, flow4: 135, flow5: 155 },
  { time: "15:14:18.45", flow1: 430, flow2: 710, flow3: 92, flow4: 170, flow5: 205 },
  { time: "15:14:18.60", flow1: 315, flow2: 735, flow3: 70, flow4: 150, flow5: 175 },
  { time: "15:14:18.75", flow1: 220, flow2: 680, flow3: 48, flow4: 125, flow5: 145 },

  { time: "15:14:19.00", flow1: 360, flow2: 760, flow3: 82, flow4: 160, flow5: 195 },
  { time: "15:14:19.20", flow1: 470, flow2: 820, flow3: 105, flow4: 195, flow5: 225 },
  { time: "15:14:19.40", flow1: 300, flow2: 690, flow3: 65, flow4: 175, flow5: 165 },
  { time: "15:14:19.60", flow1: 235, flow2: 620, flow3: 52, flow4: 145, flow5: 130 },

  { time: "15:14:19.80", flow1: 280, flow2: 660, flow3: 60, flow4: 180, flow5: 125 },
  { time: "15:14:20.00", flow1: 340, flow2: 720, flow3: 78, flow4: 215, flow5: 145 },
  { time: "15:14:20.20", flow1: 420, flow2: 790, flow3: 92, flow4: 245, flow5: 195 },
  { time: "15:14:20.40", flow1: 350, flow2: 750, flow3: 72, flow4: 235, flow5: 180 },

  { time: "15:14:20.60", flow1: 290, flow2: 700, flow3: 60, flow4: 210, flow5: 165 },
  { time: "15:14:20.80", flow1: 430, flow2: 850, flow3: 82, flow4: 250, flow5: 230 },

  { time: "15:14:21.00", flow1: 470, flow2: 920, flow3: 100, flow4: 280, flow5: 285 },
  { time: "15:14:21.15", flow1: 510, flow2: 970, flow3: 120, flow4: 295, flow5: 315 },
  { time: "15:14:21.30", flow1: 450, flow2: 900, flow3: 88,  flow4: 265, flow5: 290 },
  { time: "15:14:21.45", flow1: 390, flow2: 850, flow3: 70,  flow4: 245, flow5: 270 },

  { time: "15:14:21.60", flow1: 440, flow2: 900, flow3: 95,  flow4: 255, flow5: 285 },
  { time: "15:14:21.80", flow1: 500, flow2: 980, flow3: 118, flow4: 240, flow5: 305 },

  { time: "15:14:22",    flow1: 540, flow2: 1060, flow3: 70, flow4: 220, flow5: 310 },
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

        {/* Recent Flow Activity */}
        <section className="bg-[#0d121f] border border-[#1a2333] p-5 sm:p-6 rounded-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-[-0.02em] text-slate-800">Recent Network Flow Activity</h3>
              <p className="mt-1 text-xs font-medium text-slate-500">Five recent flows · packet activity across the last five capture windows</p>
            </div>
            <div className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-slate-600">Live capture</div>
          </div>

          <div className="mt-5 h-[20rem] sm:h-[25rem]" aria-label="Recent network flow activity chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={flowChartData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  {flows.map((flow, index) => (
                    <linearGradient id={`flow-activity-gradient-${index}`} key={`flow-gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={flow.color} stopOpacity="0.26" />
                      <stop offset="92%" stopColor={flow.color} stopOpacity="0.015" />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} stroke="#e9edf2" strokeDasharray="3 5" />
<XAxis
  dataKey="time"
  stroke="#cbd5e1"
  tick={{ fill: "#64748b" }}
  fontSize={11}
  tickLine={false}
  axisLine={false}
  dy={8}
  interval={3}
/>
                <YAxis stroke="#cbd5e1" tick={{ fill: "#64748b" }} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "12px", boxShadow: "0 8px 20px rgba(15, 23, 42, .10)" }}
                  itemStyle={{ fontSize: 12, fontWeight: 600 }}
                  labelStyle={{ color: "#475569", fontSize: 12, fontWeight: 700, marginBottom: 6 }}
                  formatter={(value, name) => [`${value} packets`, flows[Number(String(name).replace("flow", "")) - 1]?.src ?? name]}
                  labelFormatter={(label) => `Capture window: ${label}`}
                />
{flows.map((flow, index) => (
  <Area
    key={`flow-area-${index}`}
    type="natural"
    dataKey={`flow${index + 1}`}
    name={`flow${index + 1}`}
    stroke={flow.color}
    strokeWidth={2.8}
    fill={`url(#flow-activity-gradient-${index})`}
    activeDot={{
      r: 5,
      stroke: "#ffffff",
      strokeWidth: 2,
      fill: flow.color,
    }}
    isAnimationActive={false}
  />
))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-5">
            {flows.map((flow, index) => (
              <div key={`flow-legend-${index}`} className="flex min-w-0 items-center gap-2 text-[0.65rem] font-medium text-slate-500">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: flow.color }} />
                <span className="truncate">{flow.src} → {flow.dst}:{flow.port}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </TerminalLayout>
  );
}
