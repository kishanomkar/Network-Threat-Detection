import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { getHealth } from "../services/api.js";

const HealthWidget = () => {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setHealth(await getHealth());
      } catch {
        setHealth(null);
      }
    };
    load();
  }, []);

  return (
    <section className="panel p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${health ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950" : "bg-red-50 text-red-700 dark:bg-red-950"}`}>
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Backend Health</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {health ? `${health.total_loaded_models} models loaded` : "API unavailable"}
          </p>
        </div>
      </div>
      {health && (
        <div className="mt-4 flex flex-wrap gap-2">
          {health.loaded_models.map((model) => (
            <span key={model} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-200">
              {model}
            </span>
          ))}
        </div>
      )}
    </section>
  );
};

export default HealthWidget;

