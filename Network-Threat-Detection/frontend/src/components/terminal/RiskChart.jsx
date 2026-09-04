import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";

export default function RiskChart({ data = [], height = 240 }) {
  const safeData = Array.isArray(data) ? data : [];

  if (safeData.length === 0) {
    return <div style={{ width: "100%", height }} className="flex items-center justify-center border border-dashed border-slate-200 rounded-xl"><p className="text-xs font-medium text-slate-400">Run analysis to populate the risk chart</p></div>;
  }

  const chartData = safeData.map((item) => {
    const time = item.time ?? item.timestamp ?? (item.step != null ? `T+${item.step}` : "");
    const observed = item.observed != null ? Number(item.observed) : (item.risk != null && item.forecast == null ? Number(item.risk) : undefined);
    const forecast = item.forecast != null ? Number(item.forecast) : undefined;
    return { ...item, time, observed: Number.isFinite(observed) ? observed : undefined, forecast: Number.isFinite(forecast) ? forecast : undefined };
  });

  const hasObserved = chartData.some((point) => point.observed !== undefined);
  const hasForecast = chartData.some((point) => point.forecast !== undefined);
  let nowPoint = null;
  if (hasObserved && hasForecast) {
    const bridge = chartData.find((point) => point.observed !== undefined && point.forecast !== undefined);
    nowPoint = bridge?.time || [...chartData].reverse().find((point) => point.observed !== undefined)?.time || null;
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="observedGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#32bc45" stopOpacity={0.32} /><stop offset="95%" stopColor="#32bc45" stopOpacity={0} /></linearGradient>
            <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff3f3f" stopOpacity={0.35} /><stop offset="95%" stopColor="#ff3f3f" stopOpacity={0} /></linearGradient>
          </defs>
          <XAxis dataKey="time" stroke="#cbd5e1" tick={{ fill: "#64748b" }} fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#cbd5e1" tick={{ fill: "#64748b" }} fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
          <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#0f172a", borderRadius: "12px", boxShadow: "0 8px 20px rgba(15, 23, 42, .10)" }} itemStyle={{ fontSize: 12 }} formatter={(value, name) => [value != null ? `${value}%` : "--", name]} labelFormatter={(label) => `Time: ${label}`} />
          {nowPoint && <ReferenceLine x={nowPoint} stroke="#f5a019" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: "NOW", fill: "#f5a019", fontSize: 10, fontWeight: 700, position: "insideTopRight" }} />}
          <Area type="monotone" dataKey="observed" stroke="#32bc45" strokeWidth={2} fillOpacity={1} fill="url(#observedGrad)" name="Observed Risk" connectNulls={false} />
          <Area type="monotone" dataKey="forecast" stroke="#ff3f3f" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#forecastGrad)" name="Forecast Risk" connectNulls={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
