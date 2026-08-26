import { Activity, Home, Info, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { modelPages } from "../data/models.js";

const baseLinks = [
  { label: "Dashboard", path: "/", icon: Home },
  ...modelPages.map((page) => ({
    label: page.title,
    path: page.path,
    icon: page.icon,
  })),
  { label: "Health Status", path: "/health", icon: Activity },
  { label: "About", path: "/about", icon: Info },
];

const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => (
  <>
    {mobileOpen && (
      <button
        type="button"
        aria-label="Close navigation overlay"
        className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        onClick={onMobileClose}
      />
    )}

    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 88 : 288 }}
      className={`fixed inset-y-0 left-0 z-50 border-r border-slate-200 bg-white p-3 shadow-soft transition-transform dark:border-slate-800 dark:bg-slate-950 lg:sticky lg:top-0 lg:z-20 lg:h-screen ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="mb-6 flex items-center justify-between">
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-slate-950 dark:text-white">Models</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Prediction workspace</p>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="btn-secondary px-3"
          aria-label="Collapse sidebar"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="space-y-1">
        {baseLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{link.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </motion.aside>
  </>
);

export default Sidebar;

