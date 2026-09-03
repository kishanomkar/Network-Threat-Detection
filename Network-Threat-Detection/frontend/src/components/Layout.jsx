import { useState } from "react";
import Footer from "./Footer.jsx";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";

const Layout = ({ children, theme, onThemeToggle }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          onToggle={() => setCollapsed((value) => !value)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar
            theme={theme}
            onThemeToggle={onThemeToggle}
            onMenuClick={() => setMobileOpen(true)}
          />
          <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout;

