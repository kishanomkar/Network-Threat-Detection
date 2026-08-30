import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";

export default function RiskChart({ data = [], height = 240 }) {
  const safeData = Array.isArray(data) ? data : [];

  // Show empty-state message when no real data yet (no analysis run)
  if (safeData.length === 0) {
    return (
      <div
        style={{ width: "100%", height }}
        className="flex items-center justify-center border border-dashed border-slate-700 rounded"
      >
        <p className="font-mono text-xs text-slate-500">
          Run analysis to populate the risk chart
        </p>
      </div>
    );
  }

  // Normalize data points
  const chartData = safeData.map((item) => {
    const time = item.time ?? item.timestamp ?? (item.step != null ? `T+${item.step}` : "");
    const observed = item.observed != null
      ? Number(item.observed)
      : (item.risk != null && item.forecast == null ? Number(item.risk) : undefined);
    const forecast = item.forecast != null ? Number(item.forecast) : undefined;
    return {
      ...item,
      time,
      observed: Number.isFinite(observed) ? observed : undefined,
      forecast: Number.isFinite(forecast) ? forecast : undefined,
    };
  });

  // Find NOW boundary if there are both observed and forecast data points
  const hasObserved = chartData.some((d) => d.observed !== undefined);
  const hasForecast = chartData.some((d) => d.forecast !== undefined);
  let nowPoint = null;
  if (hasObserved && hasForecast) {
    const bridge = chartData.find((d) => d.observed !== undefined && d.forecast !== undefined);
    if (bridge) {
      nowPoint = bridge.time;
    } else {
      const lastObserved = [...chartData].reverse().find((d) => d.observed !== undefined);
      if (lastObserved) nowPoint = lastObserved.time;
    }
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="observedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
          <YAxis stroke="#475569" fontSize={11} tickLine={false} domain={[0, 100]} unit="%" />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" }}
            itemStyle={{ fontSize: 12 }}
            formatter={(value, name) => [value != null ? `${value}%` : "--", name]}
            labelFormatter={(label) => `Time: ${label}`}
          />
          {nowPoint && (
            <ReferenceLine
              x={nowPoint}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              strokeWidth={1.5}
              label={{
                value: "NOW",
                fill: "#f59e0b",
                fontSize: 10,
                fontWeight: 700,
                position: "insideTopRight",
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="observed"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#observedGrad)"
            name="Observed Risk"
            connectNulls={false}
          />
          <Area
            type="monotone"
            dataKey="forecast"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#forecastGrad)"
            name="Forecast Risk"
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
