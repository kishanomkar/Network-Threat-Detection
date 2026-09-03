import { motion } from "framer-motion";
import { ArrowRight, Cpu, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import PageShell from "../components/PageShell.jsx";
import PredictionCard from "../components/PredictionCard.jsx";
import { dashboardCards } from "../data/models.js";

const Home = () => (
  <PageShell>
    <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-6 p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-200">
            <ShieldCheck className="h-4 w-4" />
            Production FastAPI inference UI
          </div>
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-950 dark:text-white md:text-5xl">
            Multi Model Prediction Dashboard
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Submit features, monitor model health, and review prediction history from one clean React workspace connected to the local FastAPI backend.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/network" className="btn-primary">
              Start Prediction
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/health" className="btn-secondary">
              Check Health
            </Link>
          </div>
        </div>
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="flex min-h-56 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-slate-950"
        >
          <div className="text-center">
            <Cpu className="mx-auto h-16 w-16 text-blue-300" />
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">
              ML Inference
            </p>
            <p className="mt-2 text-4xl font-bold">4 Models</p>
          </div>
        </motion.div>
      </div>
    </section>

    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {dashboardCards.map((item) => (
        <PredictionCard key={item.id} item={item} />
      ))}
    </section>
  </PageShell>
);

export default Home;

