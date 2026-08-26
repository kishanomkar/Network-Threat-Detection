import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Network } from "lucide-react";
import FraudGraph3D from "../components/FraudGraph3D.jsx";
import FraudNodeDetails from "../components/FraudNodeDetails.jsx";
import HealthWidget from "../components/HealthWidget.jsx";
import PageShell from "../components/PageShell.jsx";
import PredictionCard from "../components/PredictionCard.jsx";
import PredictionHistory from "../components/PredictionHistory.jsx";
import PredictionTimeline from "../components/PredictionTimeline.jsx";
import RecentAlerts from "../components/RecentAlerts.jsx";
import RiskScore from "../components/RiskScore.jsx";
import { modelPages } from "../data/models.js";

const Dashboard = ({ intelligence }) => {
  const [selectedRecord, setSelectedRecord] = useState(null);

  return (
    <PageShell>
      <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-200">
              <Network className="h-4 w-4" />
              Fraud intelligence command center
            </div>
            <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-slate-950 dark:text-white md:text-5xl">
              AI Fraud Intelligence Dashboard
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Aggregate model predictions into a live 3D link-analysis graph centered on the user account. Normal predictions stay out of the graph; only suspicious detections create connected threat nodes.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/fraud" className="btn-primary">
                Run Fraud Prediction
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/credit-card" className="btn-secondary">
                Score Credit Card
              </Link>
            </div>
          </div>
          <RiskScore score={intelligence.riskScore} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <FraudGraph3D graphData={intelligence.graphData} onNodeSelect={setSelectedRecord} />
          <PredictionHistory
            items={intelligence.filteredHistory}
            query={intelligence.query}
            onQueryChange={intelligence.setQuery}
            onClear={intelligence.clearHistory}
            onExportHistory={intelligence.exportHistory}
            onExportGraph={intelligence.exportGraph}
            onExportReport={intelligence.exportRiskReport}
            onPrint={intelligence.printDashboard}
          />
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {modelPages.map((item) => (
              <PredictionCard key={item.id} item={item} />
            ))}
          </section>
        </div>

        <div className="space-y-6">
          <HealthWidget />
          <RecentAlerts alerts={intelligence.suspiciousRecords} onSelect={setSelectedRecord} />
          <PredictionTimeline events={intelligence.timeline} />
        </div>
      </div>

      <FraudNodeDetails record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </PageShell>
  );
};

export default Dashboard;

