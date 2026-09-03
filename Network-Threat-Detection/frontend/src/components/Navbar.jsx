import { Code2, Menu, Moon, Sparkles, Sun } from "lucide-react";

const Navbar = ({ onMenuClick, onThemeToggle, theme }) => (
  <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
    <div className="flex h-16 items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="btn-secondary px-3 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-950 dark:text-white">AI Prediction Hub</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">FastAPI multi-model dashboard</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <a
          href="https://github.com/"
          target="_blank"
          rel="noreferrer"
          className="btn-secondary hidden sm:inline-flex"
        >
          <Code2 className="h-4 w-4" />
          GitHub
        </a>
        <button
          type="button"
          onClick={onThemeToggle}
          className="btn-secondary px-3"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  </header>
);

export default Navbar;
