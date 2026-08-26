import { Toaster } from "react-hot-toast";
import { Navigate, Route, Routes } from "react-router-dom";
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
import NetworkIntrusion from "./pages/NetworkIntrusion.jsx";

const App = () => {
  const theme = useTheme();
  const history = usePredictionHistory();
  const intelligence = useFraudGraph();

  return (
    <>
      <Layout theme={theme.theme} onThemeToggle={theme.toggleTheme}>
        <Routes>
          <Route path="/" element={<Dashboard intelligence={intelligence} />} />
          <Route path="/network" element={<NetworkIntrusion history={history} intelligence={intelligence} />} />
          <Route path="/general" element={<GeneralModel history={history} intelligence={intelligence} />} />
          <Route path="/fraud" element={<FraudDetection history={history} intelligence={intelligence} />} />
          <Route path="/credit-card" element={<CreditCard history={history} intelligence={intelligence} />} />
          <Route path="/health" element={<Health />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </>
  );
};

export default App;
