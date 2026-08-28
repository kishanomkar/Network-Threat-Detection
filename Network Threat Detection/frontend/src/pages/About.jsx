import { useEffect, useState } from "react";
import { Boxes, BrainCircuit, Database, GitBranch, RadioTower, ServerCog, ShieldCheck } from "lucide-react";
import ErrorAlert from "../components/ErrorAlert.jsx";
import PageShell from "../components/PageShell.jsx";
import { getApiInfo, getProjectOverview } from "../services/api.js";

const fallbackOverview = {
  title: "AI Network Attack Forecasting",
  goal: "Convert traffic captures into network states, detect suspicious behavior, and forecast how attack risk may evolve.",
  demo_dataset: "CTU-13 Neris botnet PCAP sample",
  person_role: "Person 2: model integration, sequence creation, risk forecasting, explainability, and demo dashboard.",
  pipeline: [
    {
      name: "Data Pipeline",
      owner: "Person 1",
      folder: "data_pipeline",
      use: "Reads PCAP/CSV traffic and normalizes it into common packet or flow records.",
      feeds: "Network state builder",
    },
    {
      name: "Network States",
      owner: "Person 1 + Person 2",
      folder: "backend.app.state",
      use: "Builds time-window states with traffic volume, scan, beacon, and exfiltration signals.",
      feeds: "Forecasting model",
    },
    {
      name: "ANTCM Model",
      owner: "Person 2",
      folder: "ANTCM_trained_model.pkl",
      use: "Acts as the high-accuracy pretrained classifier baseline from CICIDS-style features.",
      feeds: "Model registry and future ensemble",
    },
    {
      name: "SIH Dashboard",
      owner: "Person 2",
      folder: "frontend",
      use: "Turns backend output into a judge-friendly prototype screen.",
      feeds: "Internal-round presentation",
    },
  ],
};

const iconSet = [Database, Boxes, GitBranch, BrainCircuit, RadioTower, ShieldCheck];

const About = () => {
  const [apiInfo, setApiInfo] = useState(null);
  const [overview, setOverview] = useState(fallbackOverview);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const [apiResponse, overviewResponse] = await Promise.all([getApiInfo(), getProjectOverview()]);
        setApiInfo(apiResponse);
        setOverview(overviewResponse);
      } catch (apiError) {
        setError(apiError.message || "Could not load API information.");
      }
    };
    loadInfo();
  }, []);

  return (
    <PageShell>
      <section className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
            <ShieldCheck className="h-4 w-4" />
            SIH prototype architecture
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {overview.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {overview.goal}
          </p>
        </div>

        <div className="panel p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
              <ServerCog className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-950 dark:text-white">Backend API</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{apiInfo?.version ? `Version ${apiInfo.version}` : "Local FastAPI server"}</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
            Demo dataset: <span className="font-semibold text-slate-950 dark:text-white">{overview.demo_dataset}</span>
          </div>
        </div>
      </section>

      <ErrorAlert message={error} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {overview.pipeline.map((part, index) => {
          const Icon = iconSet[index % iconSet.length];
          return (
            <article key={part.name} className="panel p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-950 dark:text-white">{part.name}</h2>
                  <p className="mt-1 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{part.owner}</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 p-3 font-mono text-xs text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                {part.folder}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{part.use}</p>
              <div className="mt-4 text-sm">
                <span className="font-semibold text-slate-950 dark:text-white">Feeds:</span>{" "}
                <span className="text-slate-600 dark:text-slate-300">{part.feeds}</span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="panel mt-6 p-5">
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">API endpoints used in the prototype</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(apiInfo?.available_endpoints || ["/health", "/api/project/overview", "/api/models", "/api/analyze"]).map((endpoint) => (
            <div key={endpoint} className="rounded-xl bg-slate-50 p-4 font-mono text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-300">
              {endpoint}
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
};

export default About;
