import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";

export default function RiskChart({ data = [], height = 240 }) {
  // Format data or provide fallback mock-trend if empty
  const chartData = data.length > 0 ? data : [
    { time: "10:00", observed: 25 },
    { time: "11:00", observed: 35 },
    { time: "12:00", observed: 30 },
    { time: "13:00", observed: 45 },
    { time: "14:00", observed: 55, forecast: 55 },
    { time: "15:00", forecast: 65 },
    { time: "16:00", forecast: 72 },
    { time: "17:00", forecast: 80 },
  ];

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="observedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
            </linearGradient>
            <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
          <YAxis stroke="#475569" fontSize={11} tickLine={false} domain={[0, 100]} />
          <Tooltip 
            contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" }}
            itemStyle={{ fontSize: 12 }}
          />
          <Area type="monotone" dataKey="observed" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#observedGrad)" name="Observed Risk" />
          <Area type="monotone" dataKey="forecast" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#forecastGrad)" name="Forecast Risk" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
