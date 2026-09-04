import TerminalSidebar from "../components/terminal/TerminalSidebar";
import TerminalTopbar from "../components/terminal/TerminalTopbar";

export default function TerminalLayout({ children, title = "SOC Command Center" }) {
  return (
    <div className="network-shell flex min-h-screen bg-[#dfff2f] text-slate-900 font-sans antialiased">
      <TerminalSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TerminalTopbar title={title} />
        <main className="flex-1 p-4 sm:p-6 lg:p-7 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
