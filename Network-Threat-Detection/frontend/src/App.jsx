import { Toaster } from "react-hot-toast";
import {Route, Routes, Outlet} from "react-router-dom";


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
import DetailedGraphicAnalysis from "./pages/network/DetailedGraphicAnalysis.jsx";

const NetworkWrapper = () => (
  <NetworkProvider>
    <Outlet />
  </NetworkProvider>
);

const App = () => {


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
          <Route path="/network/graph/detailed" element={<DetailedGraphicAnalysis />} />
          <Route path="/network/investigation" element={<InvestigationPage />} />
          <Route path="/network/explainability" element={<ExplainabilityPage />} />
          <Route path="/network/risk" element={<RiskIntelligence />} />
          <Route path="/network/data" element={<DataCapture />} />
          <Route path="/network/models" element={<ModelHealth />} />
        </Route>

        {/* Other Pages (using standard Layout) */}

      </Routes>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </>
  );
};

export default App;
