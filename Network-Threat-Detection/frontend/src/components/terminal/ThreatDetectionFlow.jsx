const nodeY = [50, 117, 184, 251, 318];

function signalSize(score) {
  return 15 + Math.round((Math.max(0, Math.min(score, 100)) / 100) * 19);
}

function routeWidth(score) {
  return 7 + Math.round((Math.max(0, Math.min(score, 100)) / 100) * 19);
}

export default function ThreatDetectionFlow({ attack, status, categories }) {
  const activeCategory = categories.find((category) => category.active)?.name;

  return (
    <section className="overflow-hidden bg-[#FAF2CA] border border-slate-200/80 p-5 sm:p-6 rounded-2xl shadow-[0_8px_18px_rgba(70,91,21,0.07)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-[-0.02em] text-slate-900">Threat Detection Flow</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">Overall threat detection routed into the current-window classification signals.</p>
        </div>
        <div className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-slate-600">
          Current window
        </div>
      </div>

      <div className="mt-5 hidden min-[700px]:block" aria-label="Threat detection flow chart">
        <svg className="block h-auto w-full " viewBox="0 0 1120 368" role="img" aria-labelledby="threat-flow-title threat-flow-description" style={{ fontFamily: "inherit" }}>
          <title id="threat-flow-title">Threat detection flow</title>
          <desc id="threat-flow-description">Overall threat detection is distributed to DoS, Port Scan, C2 Beaconing, Exfiltration, and Anomaly signals. Route width and node size show signal strength.</desc>
          <defs>
            <filter id="threat-flow-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {categories.map((category) => (
              <linearGradient id={`threat-route-${category.key}`} key={`gradient-${category.key}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={category.color} stopOpacity="0.72" />
                <stop offset="100%" stopColor={category.color} stopOpacity="0.2" />
              </linearGradient>
            ))}
          </defs>

          <text x="52" y="20" className="fill-slate-400 text-[11px] font-bold uppercase tracking-[0.16em]">Source</text>
          <text x="778" y="20" className="fill-slate-400 text-[11px] font-bold uppercase tracking-[0.16em]">Detection families</text>

          {categories.map((category, index) => {
            const y = nodeY[index];
            return (
              <path
                key={`route-${category.key}`}
                d={`M 153 184 C 325 184, 475 ${y}, 754 ${y}`}
                fill="none"
                stroke={`url(#threat-route-${category.key})`}
                strokeLinecap="round"
                strokeWidth={routeWidth(category.score)}
                className="transition-all duration-500"
              />
            );
          })}

          {/* Keep the C2 branch in the foreground so its direct route remains visible at the central fan-out. */}
          {categories.filter((category) => category.key === "c2").map((category) => (
            <path
              key="c2-route-foreground"
              d="M 153 184 C 25 174, 475 204, 738 184"
              fill="none"
              stroke={category.color}
              strokeLinecap="round"
              strokeOpacity="0.62"
              strokeWidth={routeWidth(category.score)}
            />
          ))}

          <circle cx="111" cy="184" r="50" fill="#fff7ed" stroke="#fb923c" strokeWidth="2" />
          <circle cx="111" cy="184" r="39" fill="#f97316" opacity="0.12" filter="url(#threat-flow-glow)" />
          <circle cx="111" cy="184" r="28" fill="#f97316" />
          

          <text x="111" y="252" textAnchor="middle" className="fill-slate-900 text-[13px] font-extrabold">OVERALL THREAT</text>
          <text x="111" y="271" textAnchor="middle" className="fill-slate-500 text-[11px] font-medium">{status}</text>

          {categories.map((category, index) => {
            const y = nodeY[index];
            const size = signalSize(category.score);
            const active = category.name === activeCategory;
            return (
              <g key={category.key} className="transition-all duration-500">
                {active && <circle cx="754" cy={y} r={size + 8} fill={category.color} opacity="0.12" />}
                <circle cx="754" cy={y} r={size} fill={category.color} opacity={active ? "1" : "0.78"} />
                <circle cx="754" cy={y} r={Math.max(size - 5, 8)} fill="none" stroke="white" strokeOpacity="0.34" />
                <text x="799" y={y - 4} className="fill-slate-900 text-[14px] font-extrabold">{category.name}</text>
                <text x="799" y={y + 15} className="fill-slate-500 text-[11px] font-medium">{category.signalLabel} · {category.score}% signal</text>
              </g>
            );
          })}


        </svg>
      </div>

      <div className="mt-5 space-y-3 min-[700px]:hidden" aria-label="Threat detection flow summary">
        <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-lg font-bold text-white">+</span>
          <div><div className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">Overall threat detection</div><div className="text-sm font-extrabold text-slate-900">{attack}</div></div>
        </div>
        {categories.map((category) => (
          <div key={`mobile-${category.key}`} className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-extrabold text-slate-800">{category.name}</span>
              <span className="font-bold" style={{ color: category.color }}>{category.score}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${category.score}%`, backgroundColor: category.color }} /></div>
            <div className="mt-1.5 text-[0.65rem] font-medium text-slate-500">{category.signalLabel}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.65rem] font-medium text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-500" /> Active classification: {attack}</span>
        {/* <span>Route width and node size represent detection signal strength.</span> */}
      </div>
    </section>
  );
}
