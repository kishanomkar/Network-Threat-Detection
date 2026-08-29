export default function MetricCard({ title, value, subtext, trend, color = "cyan" }) {
  const colorStyles = {
    emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    amber: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    red: "text-red-400 border-red-500/20 bg-red-500/5",
    blue: "text-blue-400 border-blue-500/20 bg-blue-500/5",
    cyan: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
    purple: "text-purple-400 border-purple-500/20 bg-purple-500/5",
  };

  return (
    <div className="bg-[#0d121f] border border-[#1a2333] p-4 rounded-sm flex flex-col justify-between">
      <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </div>
      <div className="my-2 flex items-baseline justify-between">
        <div className={`text-2xl font-mono font-bold tracking-tight ${colorStyles[color] || "text-slate-100"}`}>
          {value ?? "--"}
        </div>
        {trend && (
          <span className={`text-xs font-mono font-semibold ${trend.startsWith("+") ? "text-red-400" : "text-emerald-400"}`}>
            {trend}
          </span>
        )}
      </div>
      {subtext && (
        <div className="text-[10px] font-mono text-slate-500 truncate">
          {subtext}
        </div>
      )}
    </div>
  );
}
