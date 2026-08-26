import { motion } from "framer-motion";

const PageShell = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.25 }}
    className="mx-auto max-w-7xl"
  >
    {children}
  </motion.div>
);

export default PageShell;

