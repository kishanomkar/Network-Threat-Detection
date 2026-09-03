import { motion } from "framer-motion";

const Loader = ({ label = "Running ML Model..." }) => (
  <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
    <motion.span
      className="h-5 w-5 rounded-full border-2 border-blue-200 border-t-blue-600"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    />
    {label}
  </div>
);

export default Loader;

