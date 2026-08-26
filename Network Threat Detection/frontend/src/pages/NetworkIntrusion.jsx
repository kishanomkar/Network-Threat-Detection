import PredictionPage from "./PredictionPage.jsx";
import { modelPages } from "../data/models.js";

const NetworkIntrusion = ({ history, intelligence }) => (
  <PredictionPage model={modelPages.find((model) => model.id === "network_intrusion")} history={history} intelligence={intelligence} />
);

export default NetworkIntrusion;
