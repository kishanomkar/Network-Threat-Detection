import { Crosshair, ShieldAlert, TrendingUp, UsersRound, Waypoints, BadgeCheck } from "lucide-react";

export default function MetricCard({ title, value, subtext, trend, color = "cyan" }) {
  const themes = {
    emerald: { value: "text-[#37ba4b]", icon: "bg-[#e7f7e8] text-[#37ba4b]", Icon: BadgeCheck },
    amber: { value: "text-[#f5a019]", icon: "bg-[#fff4df] text-[#f2a01a]", Icon: TrendingUp },
    red: { value: "text-[#ff3737]", icon: "bg-[#ffe9e9] text-[#ff4141]", Icon: ShieldAlert },
    blue: { value: "text-[#3578f6]", icon: "bg-[#eaf1ff] text-[#3578f6]", Icon: Waypoints },
    cyan: { value: "text-[#24b7be]", icon: "bg-[#e6f8f8] text-[#24b7be]", Icon: UsersRound },
    purple: { value: "text-[#8745e8]", icon: "bg-[#f1eaff] text-[#8745e8]", Icon: Crosshair },
  };
  const theme = themes[color] || themes.cyan;
  const Icon = theme.Icon;

  return (
    <div className="min-h-[10.7rem] bg-[#FAF2CA] border border-slate-200/80 px-5 py-5 rounded-2xl flex flex-col justify-between shadow-[0_8px_18px_rgba(70,91,21,0.07)]">
      <div className="text-[0.72rem] font-bold uppercase tracking-wide text-slate-600">{title}</div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className={`min-w-0 truncate text-[1.75rem] leading-none font-medium tracking-[-0.05em] ${theme.value}`}>{value ?? "--"}</div>
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${theme.icon}`}><Icon className="h-7 w-7 stroke-[1.8]" /></div>
      </div>
      <div className="mt-2 flex items-center gap-2 min-h-[1rem]">
        {subtext && <div className="min-w-0 truncate text-xs font-medium text-slate-500">{subtext}</div>}
        {trend && <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold ${trend.startsWith("+") ? "bg-[#fff0db] text-[#f29a19]" : "bg-[#e8f7eb] text-[#35b649]"}`}>{trend}</span>}
      </div>
    </div>
  );
}
