import PredictionPage from "./PredictionPage.jsx";
import { modelPages } from "../data/models.js";

const CreditCard = ({ history, intelligence }) => (
  <PredictionPage model={modelPages.find((model) => model.id === "credit_card")} history={history} intelligence={intelligence} />
);

export default CreditCard;
