import TerminalSidebar from "../components/terminal/TerminalSidebar";
import TerminalTopbar from "../components/terminal/TerminalTopbar";

export default function TerminalLayout({ children, title = "SOC Command Center" }) {
  return (
    <div className="flex min-h-screen bg-[#070a12] text-slate-100 font-sans antialiased">
      <TerminalSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TerminalTopbar title={title} />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
