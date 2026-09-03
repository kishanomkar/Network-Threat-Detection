import PredictionPage from "./PredictionPage.jsx";
import { modelPages } from "../data/models.js";

const GeneralModel = ({ history, intelligence }) => (
  <PredictionPage model={modelPages.find((model) => model.id === "general")} history={history} intelligence={intelligence} />
);

export default GeneralModel;
