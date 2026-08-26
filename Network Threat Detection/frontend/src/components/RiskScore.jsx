import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { riskScoreColor, riskScoreLabel } from "../utils/riskCalculator.js";

const RiskScore = ({ score }) => {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <section className="panel p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">AI Fraud Risk</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Combined suspicious prediction score</p>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-center">
        <div className="relative h-40 w-40">
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
            <circle cx="64" cy="64" r="54" fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-slate-800" />
            <motion.circle
              cx="64"
              cy="64"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="12"
              className={riskScoreColor(score)}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${riskScoreColor(score)}`}>{score}%</span>
            <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {riskScoreLabel(score)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RiskScore;

