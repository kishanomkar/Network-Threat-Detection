import { Toaster } from "react-hot-toast";
import { Navigate, Route, Routes, Outlet } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import { usePredictionHistory } from "./hooks/usePredictionHistory.js";
import { useFraudGraph } from "./hooks/useFraudGraph.js";
import { useTheme } from "./hooks/useTheme.js";
import About from "./pages/About.jsx";
import CreditCard from "./pages/CreditCard.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import FraudDetection from "./pages/FraudDetection.jsx";
import GeneralModel from "./pages/GeneralModel.jsx";
import Health from "./pages/Health.jsx";

// Network SOC Context & Pages
import { NetworkProvider } from "./context/NetworkContext.jsx";
import Overview from "./pages/network/Overview.jsx";
import CurrentThreats from "./pages/network/CurrentThreats.jsx";
import TrafficAnalysis from "./pages/network/TrafficAnalysis.jsx";
import AttackForecast from "./pages/network/AttackForecast.jsx";
import AttackProgression from "./pages/network/AttackProgression.jsx";
import NetworkGraphPage from "./pages/network/NetworkGraphPage.jsx";
import InvestigationPage from "./pages/network/InvestigationPage.jsx";
import ExplainabilityPage from "./pages/network/ExplainabilityPage.jsx";
import RiskIntelligence from "./pages/network/RiskIntelligence.jsx";
import DataCapture from "./pages/network/DataCapture.jsx";
import ModelHealth from "./pages/network/ModelHealth.jsx";
import Landing from "./pages/Landing.jsx";

const NetworkWrapper = () => (
  <NetworkProvider>
    <Outlet />
  </NetworkProvider>
);

const App = () => {
  const theme = useTheme();
  const history = usePredictionHistory();
  const intelligence = useFraudGraph();

  return (
    <>
      <Routes>
        {/* Network SOC Pages (wrapped in NetworkProvider) */}
                <Route path="/" element={<Landing/>} />
        <Route element={<NetworkWrapper />}>
          <Route path="/network" element={<Overview />} />
          <Route path="/network/threats" element={<CurrentThreats />} />
          <Route path="/network/traffic" element={<TrafficAnalysis />} />
          <Route path="/network/forecast" element={<AttackForecast />} />
          <Route path="/network/progression" element={<AttackProgression />} />
          <Route path="/network/graph" element={<NetworkGraphPage />} />
          <Route path="/network/investigation" element={<InvestigationPage />} />
          <Route path="/network/explainability" element={<ExplainabilityPage />} />
          <Route path="/network/risk" element={<RiskIntelligence />} />
          <Route path="/network/data" element={<DataCapture />} />
          <Route path="/network/models" element={<ModelHealth />} />
        </Route>

        {/* Other Pages (using standard Layout) */}
        <Route
          path="/*"
          element={
            <Layout theme={theme.theme} onThemeToggle={theme.toggleTheme}>
              <Routes>
                <Route path="/general" element={<GeneralModel history={history} intelligence={intelligence} />} />
                <Route path="/fraud" element={<FraudDetection history={history} intelligence={intelligence} />} />
                <Route path="/credit-card" element={<CreditCard history={history} intelligence={intelligence} />} />
                <Route path="/health" element={<Health />} />
                <Route path="/about" element={<About />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </>
  );
};

export default App;
