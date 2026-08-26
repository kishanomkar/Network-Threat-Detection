const legendItems = [
  ["Account", "bg-blue-600"],
  ["Suspicious", "bg-amber-500"],
  ["High Risk", "bg-red-600"],
  ["Critical", "bg-red-950"],
];

const GraphLegend = () => (
  <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
    {legendItems.map(([label, color]) => (
      <span key={label} className="inline-flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full ${color}`} />
        {label}
      </span>
    ))}
  </div>
);

export default GraphLegend;

