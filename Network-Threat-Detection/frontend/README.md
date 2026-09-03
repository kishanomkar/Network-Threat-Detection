# Multi Model Prediction Frontend

Modern React dashboard for the local FastAPI multi-model prediction API.

## Features

- Vite + React single-page application
- Tailwind CSS responsive dashboard UI
- Axios API service for FastAPI endpoints
- React Router pages for all models
- Dictionary and list input modes
- Dynamic add/remove feature fields
- React Hook Form validation
- Toast notifications
- Health monitoring with 30-second auto-refresh
- Prediction history in localStorage
- Search and clear history
- Copy and download prediction JSON
- Light and dark mode
- Fraud intelligence dashboard with 3D link analysis
- Suspicious-only graph node creation
- AI fraud risk score
- Recent alerts and fraud timeline
- Graph JSON, history, and risk report exports

## Backend Connection

During development, the frontend uses Vite's `/api` proxy to reach:

```text
https://chilli-bomb.onrender.com/
```

The default client base URL is:

```text
/api
```

You can override it with:

```bash
VITE_API_BASE_URL=https://chilli-bomb.onrender.com/
```

Backend endpoints used:

```text
GET /
GET /health
POST /predict/network_intrusion
POST /predict/general
POST /predict/fraud
POST /predict/credit_card
```

Start the FastAPI backend before running predictions:

```bash
uvicorn app:app --reload
```

## Setup

From this `frontend` directory:

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

## Build

```bash
npm run build
npm run preview
```

## Folder Structure

```text
src/
  components/
    ErrorAlert.jsx
    FeatureInput.jsx
    Footer.jsx
    FraudGraph3D.jsx
    FraudNodeDetails.jsx
    GraphLegend.jsx
    HealthStatus.jsx
    HealthWidget.jsx
    HistoryPanel.jsx
    Layout.jsx
    Loader.jsx
    Navbar.jsx
    PageShell.jsx
    PredictionCard.jsx
    PredictionHistory.jsx
    PredictionResult.jsx
    PredictionTimeline.jsx
    Sidebar.jsx
    RecentAlerts.jsx
    RiskScore.jsx
  data/
    models.js
  hooks/
    useFraudGraph.js
    usePredictionHistory.js
    useTheme.js
  pages/
    About.jsx
    CreditCard.jsx
    Dashboard.jsx
    FraudDetection.jsx
    GeneralModel.jsx
    Health.jsx
    Home.jsx
    NetworkIntrusion.jsx
    PredictionPage.jsx
  services/
    api.js
  utils/
    format.js
    storage.js
  App.jsx
  main.jsx
```

## Screenshots

Add screenshots after running locally:

```text
docs/screenshots/dashboard.png
docs/screenshots/prediction.png
docs/screenshots/health.png
```

## Notes

- Fraud transaction types such as `PAYMENT`, `TRANSFER`, `CASH_OUT`, `CASH_IN`, and `DEBIT` can be entered directly.
- Network intrusion examples use KDD-style packet fields such as `duration`, `protocol_type`, `service`, `flag`, and `src_bytes`.
- Credit card prediction expects numerical `V1` through `V28` values plus `Amount`.
