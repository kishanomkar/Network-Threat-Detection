import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const PredictionCard = ({ item }) => {
  const Icon = item.icon;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="panel group overflow-hidden p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          <Icon className="h-6 w-6" />
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {item.endpoint}
        </span>
      </div>
      <div className="mt-5">
        <h3 className="text-lg font-bold text-slate-950 dark:text-white">{item.title}</h3>
        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {item.description}
        </p>
      </div>
      <Link to={item.path} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
        Open
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
};

export default PredictionCard;

