import PredictionPage from "./PredictionPage.jsx";
import { modelPages } from "../data/models.js";

const FraudDetection = ({ history, intelligence }) => (
  <PredictionPage model={modelPages.find((model) => model.id === "fraud")} history={history} intelligence={intelligence} />
);

export default FraudDetection;
