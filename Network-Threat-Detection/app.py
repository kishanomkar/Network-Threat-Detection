from __future__ import annotations

import logging
import time
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Literal

import joblib
import numpy as np
import pandas as pd
from fastapi import Body, FastAPI, HTTPException, Request, Response
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sklearn.feature_selection import SelectKBest, f_regression
from sklearn.preprocessing import LabelEncoder, StandardScaler
from fastapi.middleware.cors import CORSMiddleware


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("multi_model_prediction_api")

APP_NAME = "Multi Model Prediction API"
APP_VERSION = "1.0.0"
START_TIME = time.monotonic()
PROJECT_DIR = Path.cwd()
LABEL_ENCODER_FILE = "label_encoder.pkl"
NETWORK_TRAINING_FILE = "Train_data.csv"
NETWORK_SELECTED_FEATURE_COUNT = 25


class ModelConfig(BaseModel):
    key: str
    file_name: str
    endpoint: str
    display_name: str


MODEL_CONFIGS: dict[str, ModelConfig] = {
    "network_intrusion": ModelConfig(
        key="network_intrusion",
        file_name="network_intrusion_detection_model.pkl",
        endpoint="/predict/network_intrusion",
        display_name="Network Intrusion Detection",
    ),
    "general": ModelConfig(
        key="general",
        file_name="model.pkl",
        endpoint="/predict/general",
        display_name="General",
    ),
    "fraud": ModelConfig(
        key="fraud",
        file_name="fraud_detection_model.pkl",
        endpoint="/predict/fraud",
        display_name="Fraud Detection",
    ),
    "credit_card": ModelConfig(
        key="credit_card",
        file_name="credit_card_model.pkl",
        endpoint="/predict/credit_card",
        display_name="Credit Card Fraud Detection",
    ),
}

# Example payloads accepted by every prediction endpoint:
# Dictionary format:
# {
#     "features": {
#         "age": 35,
#         "income": 55000,
#         "gender": "Male"
#     }
# }
#
# List format:
# {
#     "features": [
#         35,
#         55000,
#         1
#     ]
# }

loaded_models: dict[str, Any] = {}
label_encoder: Any | None = None
network_preprocessor: dict[str, Any] = {}


class PredictionRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "features": {
                        "step": 1,
                        "type": "PAYMENT",
                        "amount": 9839.64,
                        "oldbalanceOrg": 170136.0,
                        "newbalanceOrig": 160296.36,
                        "oldbalanceDest": 0.0,
                        "newbalanceDest": 0.0,
                        "isFlaggedFraud": 0,
                    }
                },
                {"features": [1, "PAYMENT", 9839.64, 170136.0, 160296.36, 0.0, 0.0, 0]},
            ]
        }
    )

    features: dict[str, Any] | list[Any] = Field(
        ...,
        description="Feature values as either a named dictionary or ordered list.",
    )

    @field_validator("features")
    @classmethod
    def validate_features(
        cls,
        value: dict[str, Any] | list[Any],
    ) -> dict[str, Any] | list[Any]:
        if isinstance(value, dict):
            if not value:
                raise ValueError("features dictionary must not be empty")
            for key, item in value.items():
                if not isinstance(key, str) or not key.strip():
                    raise ValueError("all feature names must be non-empty strings")
                validate_feature_value(item, f"features.{key}")
            return value

        if isinstance(value, list):
            if not value:
                raise ValueError("features list must not be empty")
            for index, item in enumerate(value):
                validate_feature_value(item, f"features[{index}]")
            return value

        raise ValueError("features must be either an object or an array")


class PredictionResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "model_name": "network_intrusion",
                "prediction": "normal",
                "probability": 0.9834,
                "status": "success",
            }
        }
    )

    model_name: str
    prediction: str
    probability: float | None
    status: Literal["success"]


class HealthResponse(BaseModel):
    status: Literal["healthy"]
    loaded_models: list[str]
    total_loaded_models: int
    uptime_seconds: float


class RootResponse(BaseModel):
    application: str
    version: str
    available_endpoints: list[str]


class ErrorResponse(BaseModel):
    status: Literal["error"]
    message: str
    detail: Any | None = None


def validate_feature_value(value: Any, field_path: str) -> None:
    if value is None:
        raise ValueError(f"{field_path} must not be null")
    if isinstance(value, (dict, list, tuple, set)):
        raise ValueError(f"{field_path} must be a scalar value")
    if not isinstance(value, (str, int, float, bool, np.integer, np.floating, np.bool_)):
        raise ValueError(f"{field_path} has unsupported type {type(value).__name__}")


def load_artifact(file_name: str) -> Any | None:
    artifact_path = PROJECT_DIR / file_name
    if not artifact_path.exists():
        logger.warning("Artifact not found: %s", artifact_path)
        return None

    try:
        artifact = joblib.load(artifact_path)
    except Exception as exc:
        logger.error("Failed to load %s: %s", artifact_path.name, exc)
        return None

    logger.info("Loaded artifact: %s", artifact_path.name)
    return artifact


def load_models() -> None:
    loaded_models.clear()
    logger.info("Starting model loading from %s", PROJECT_DIR)

    for model_key, config in MODEL_CONFIGS.items():
        model = load_artifact(config.file_name)
        if model is None:
            logger.warning("Model %s was not loaded", model_key)
            continue
        loaded_models[model_key] = model
        logger.info("Model %s loaded successfully", model_key)


def load_label_encoder() -> None:
    global label_encoder
    label_encoder = load_artifact(LABEL_ENCODER_FILE)
    if label_encoder is None:
        logger.warning("No label encoder loaded; categorical encoding will be skipped")
    else:
        logger.info("Label encoder loaded successfully")


def build_network_preprocessor() -> None:
    network_preprocessor.clear()
    training_path = PROJECT_DIR / NETWORK_TRAINING_FILE
    if not training_path.exists():
        logger.warning("Network training file not found: %s", training_path)
        return

    try:
        training_data = pd.read_csv(training_path)
        if "class" not in training_data.columns:
            logger.warning("Network training file is missing required 'class' column")
            return

        feature_data = training_data.drop(columns=["class"])
        target_data = training_data["class"]
        feature_columns = list(feature_data.columns)
        categorical_columns = list(feature_data.select_dtypes(include=["object"]).columns)
        feature_encoders: dict[str, LabelEncoder] = {}
        raw_defaults: dict[str, Any] = {}

        for column in feature_columns:
            if column in categorical_columns:
                mode = feature_data[column].mode(dropna=True)
                raw_defaults[column] = str(mode.iloc[0]) if not mode.empty else ""
                encoder = LabelEncoder()
                feature_data[column] = encoder.fit_transform(feature_data[column].astype(str))
                feature_encoders[column] = encoder
            else:
                raw_defaults[column] = float(feature_data[column].median())

        target_encoder = LabelEncoder()
        target = target_encoder.fit_transform(target_data.astype(str))

        scaler = StandardScaler()
        scaled_features = scaler.fit_transform(feature_data)

        selector = SelectKBest(score_func=f_regression, k=NETWORK_SELECTED_FEATURE_COUNT)
        selector.fit(scaled_features, target)

        network_preprocessor.update(
            {
                "feature_columns": feature_columns,
                "categorical_columns": categorical_columns,
                "feature_encoders": feature_encoders,
                "raw_defaults": raw_defaults,
                "target_encoder": target_encoder,
                "scaler": scaler,
                "selector": selector,
            }
        )
        logger.info("Network preprocessor rebuilt from %s", NETWORK_TRAINING_FILE)
    except Exception as exc:
        logger.error("Failed to build network preprocessor: %s", exc)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    logger.info("%s startup initiated", APP_NAME)
    load_models()
    load_label_encoder()
    build_network_preprocessor()
    logger.info("%s startup complete", APP_NAME)
    yield
    logger.info("%s shutdown complete", APP_NAME)


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Production-ready FastAPI server for multiple scikit-learn compatible models.",
    lifespan=lifespan,
)

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "https://chilli-bomb-client.vercel.app",
    "https://chilli-bomb-1.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    started_at = time.perf_counter()
    logger.info("Incoming request: %s %s", request.method, request.url.path)

    response = await call_next(request)

    elapsed_ms = (time.perf_counter() - started_at) * 1000
    logger.info(
        "Completed request: %s %s -> %s in %.2f ms",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    message = exc.detail if isinstance(exc.detail, str) else "Request failed"
    return JSONResponse(
        status_code=exc.status_code,
        content=jsonable_encoder(
            ErrorResponse(status="error", message=message, detail=exc.detail)
        ),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content=jsonable_encoder(
            ErrorResponse(
                status="error",
                message="Invalid request payload",
                detail=exc.errors(),
            )
        ),
    )


@app.exception_handler(Exception)
async def generic_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled application error: %s", exc)
    return JSONResponse(
        status_code=500,
        content=jsonable_encoder(
            ErrorResponse(
                status="error",
                message="Internal server error",
                detail=None,
            )
        ),
    )


def ensure_no_unhandled_strings(data: pd.DataFrame | np.ndarray, model_name: str) -> None:
    if isinstance(data, pd.DataFrame):
        string_columns = [
            column
            for column in data.columns
            if data[column].map(lambda item: isinstance(item, str)).any()
        ]
        if string_columns:
            raise HTTPException(
                status_code=422,
                detail=f"String features are not supported for model '{model_name}': {string_columns}",
            )
        return

    if any(isinstance(item, str) for item in data.ravel()):
        raise HTTPException(
            status_code=422,
            detail=f"String features are not supported for model '{model_name}' list payloads",
        )


def encode_with_label_encoder(value: Any, field_name: str) -> int:
    if label_encoder is None:
        raise HTTPException(
            status_code=422,
            detail=f"Cannot encode '{field_name}' because label_encoder.pkl is not loaded",
        )

    try:
        return int(label_encoder.transform([str(value)])[0])
    except ValueError as exc:
        logger.warning("Categorical encoding failed for %s: %s", field_name, exc)
        raise HTTPException(
            status_code=422,
            detail=f"Categorical encoding failed for '{field_name}'. Unseen or invalid category: {exc}",
        ) from exc


def prepare_named_features(model: Any, features: dict[str, Any], model_name: str) -> pd.DataFrame:
    feature_names = getattr(model, "feature_names_in_", None)
    if feature_names is None:
        return pd.DataFrame([features])

    missing_features = [name for name in feature_names if name not in features]
    if missing_features:
        raise HTTPException(
            status_code=422,
            detail=f"Missing required features for model '{model_name}': {missing_features}",
        )

    ordered_features = {name: features[name] for name in feature_names}
    frame = pd.DataFrame([ordered_features])
    return frame


def build_network_input(features: dict[str, Any] | list[Any]) -> pd.DataFrame | np.ndarray:
    if not network_preprocessor:
        raise HTTPException(
            status_code=500,
            detail="Network intrusion preprocessor is not available",
        )

    if isinstance(features, list):
        array = np.asarray(features, dtype=object)
        if array.ndim == 1:
            array = array.reshape(1, -1)
        if array.shape[1] == NETWORK_SELECTED_FEATURE_COUNT:
            ensure_no_unhandled_strings(array, "network_intrusion")
            return array.astype(float)

        feature_columns = network_preprocessor["feature_columns"]
        if array.shape[1] != len(feature_columns):
            raise HTTPException(
                status_code=422,
                detail=(
                    "Network intrusion list payload must contain either "
                    f"{NETWORK_SELECTED_FEATURE_COUNT} selected numeric features or "
                    f"{len(feature_columns)} raw features"
                ),
            )
        features = dict(zip(feature_columns, array.ravel(), strict=True))

    feature_columns = network_preprocessor["feature_columns"]
    raw_defaults = network_preprocessor["raw_defaults"]
    categorical_columns = network_preprocessor["categorical_columns"]
    feature_encoders = network_preprocessor["feature_encoders"]
    scaler = network_preprocessor["scaler"]
    selector = network_preprocessor["selector"]

    merged_features = dict(raw_defaults)
    unknown_features = sorted(set(features) - set(feature_columns))
    if unknown_features:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown network intrusion features: {unknown_features}",
        )
    merged_features.update(features)

    frame = pd.DataFrame([[merged_features[column] for column in feature_columns]], columns=feature_columns)
    for column in categorical_columns:
        try:
            frame[column] = feature_encoders[column].transform(frame[column].astype(str))
        except ValueError as exc:
            logger.warning("Network categorical encoding failed for %s: %s", column, exc)
            raise HTTPException(
                status_code=422,
                detail=f"Invalid category for network feature '{column}': {exc}",
            ) from exc

    try:
        frame = frame.astype(float)
        scaled = scaler.transform(frame)
        selected = selector.transform(scaled)
        return selected
    except Exception as exc:
        logger.warning("Network preprocessing failed: %s", exc)
        raise HTTPException(
            status_code=422,
            detail=f"Network preprocessing failed: {exc}",
        ) from exc


def build_fraud_input(
    model: Any,
    features: dict[str, Any] | list[Any],
) -> pd.DataFrame | np.ndarray:
    if isinstance(features, dict):
        prepared_features = dict(features)
        if isinstance(prepared_features.get("type"), str):
            prepared_features["type"] = encode_with_label_encoder(prepared_features["type"], "type")
        frame = prepare_named_features(model, prepared_features, "fraud")
        ensure_no_unhandled_strings(frame, "fraud")
        return frame

    array = np.asarray(features, dtype=object)
    if array.ndim == 1:
        array = array.reshape(1, -1)

    feature_names = list(getattr(model, "feature_names_in_", []))
    if "type" in feature_names:
        type_index = feature_names.index("type")
        if array.shape[1] > type_index and isinstance(array[0, type_index], str):
            array[0, type_index] = encode_with_label_encoder(array[0, type_index], "type")

    ensure_no_unhandled_strings(array, "fraud")
    return array.astype(float)


def build_model_input(
    model_name: str,
    model: Any,
    features: dict[str, Any] | list[Any],
) -> pd.DataFrame | np.ndarray:
    if model_name == "network_intrusion":
        return build_network_input(features)

    if model_name == "fraud":
        return build_fraud_input(model, features)

    if isinstance(features, dict):
        frame = prepare_named_features(model, features, model_name)
        ensure_no_unhandled_strings(frame, model_name)
        return frame

    array = np.asarray(features, dtype=object)
    if array.ndim == 1:
        array = array.reshape(1, -1)
    ensure_no_unhandled_strings(array, model_name)
    return array.astype(float)


def to_serializable_value(value: Any) -> str:
    if isinstance(value, np.generic):
        value = value.item()
    return str(value)


def decode_prediction(model_name: str, prediction: Any) -> str:
    if model_name == "network_intrusion" and network_preprocessor.get("target_encoder") is not None:
        try:
            target_encoder = network_preprocessor["target_encoder"]
            decoded = target_encoder.inverse_transform([int(prediction)])[0]
            return to_serializable_value(decoded)
        except Exception as exc:
            logger.warning("Could not decode network prediction label: %s", exc)

    return to_serializable_value(prediction)


def calculate_probability(model: Any, model_input: pd.DataFrame | np.ndarray) -> float | None:
    if not hasattr(model, "predict_proba"):
        return None

    try:
        probabilities = model.predict_proba(model_input)
        probability_array = np.asarray(probabilities)
        if probability_array.ndim == 1:
            probability = float(np.max(probability_array))
        else:
            probability = float(np.max(probability_array[0]))
        return round(probability, 4)
    except Exception as exc:
        logger.warning("predict_proba failed; returning null probability: %s", exc)
        return None


def predict_model(model_name: str, request: PredictionRequest) -> PredictionResponse:
    config = MODEL_CONFIGS.get(model_name)
    if config is None:
        raise HTTPException(status_code=404, detail=f"Unknown model: {model_name}")

    model = loaded_models.get(model_name)
    if model is None:
        raise HTTPException(
            status_code=404,
            detail=f"Model '{model_name}' is not loaded or file '{config.file_name}' is missing",
        )

    started_at = time.perf_counter()
    try:
        model_input = build_model_input(model_name, model, request.features)
        raw_prediction = model.predict(model_input)
        prediction_array = np.asarray(raw_prediction)
        prediction = decode_prediction(model_name, prediction_array.ravel()[0])
        probability = calculate_probability(model, model_input)
    except HTTPException:
        raise
    except ValueError as exc:
        logger.warning("Prediction validation failed for %s: %s", model_name, exc)
        raise HTTPException(status_code=422, detail=f"Invalid features for model: {exc}") from exc
    except Exception as exc:
        logger.error("Prediction failed for %s: %s", model_name, exc)
        raise HTTPException(status_code=500, detail="Prediction failed") from exc

    elapsed_ms = (time.perf_counter() - started_at) * 1000
    logger.info("Prediction completed for %s in %.2f ms", model_name, elapsed_ms)

    return PredictionResponse(
        model_name=model_name,
        prediction=prediction,
        probability=probability,
        status="success",
    )


@app.get(
    "/",
    response_model=RootResponse,
    summary="API information",
    description="Returns application metadata and available endpoints.",
)
async def root() -> RootResponse:
    return RootResponse(
        application=APP_NAME,
        version=APP_VERSION,
        available_endpoints=[
            "/predict/network_intrusion",
            "/predict/general",
            "/predict/fraud",
            "/predict/credit_card",
            "/health",
        ],
    )


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Returns API health, loaded model keys, model count, and uptime.",
)
async def health() -> HealthResponse:
    loaded_model_keys = sorted(loaded_models.keys())
    return HealthResponse(
        status="healthy",
        loaded_models=loaded_model_keys,
        total_loaded_models=len(loaded_model_keys),
        uptime_seconds=round(time.monotonic() - START_TIME, 2),
    )


@app.post(
    "/predict/network_intrusion",
    response_model=PredictionResponse,
    responses={200: {"description": "Successful prediction"}},
    summary="Predict network intrusion",
    description="Run inference with network_intrusion_detection_model.pkl.",
)
async def predict_network_intrusion(
    request: PredictionRequest = Body(
        ...,
        examples=[
            {
                "features": {
                    "duration": 10,
                    "protocol_type": "tcp",
                    "service": "http",
                    "flag": "SF",
                    "src_bytes": 123,
                }
            },
            {"features": [10, 1, 5, 7, 0, 25]},
        ],
    ),
) -> PredictionResponse:
    return predict_model("network_intrusion", request)


@app.post(
    "/predict/general",
    response_model=PredictionResponse,
    responses={200: {"description": "Successful prediction"}},
    summary="Predict with general model",
    description="Run inference with model.pkl.",
)
async def predict_general(
    request: PredictionRequest = Body(
        ...,
        examples=[
            {
                "features": {
                    "step": 1,
                    "amount": 9839.64,
                    "oldbalanceOrg": 170136.0,
                    "newbalanceOrig": 160296.36,
                    "oldbalanceDest": 0.0,
                    "newbalanceDest": 0.0,
                    "hour": 1,
                    "is_night": 1,
                    "amount_ratio": 0.0578,
                    "sender_balance_change": 9839.64,
                    "receiver_balance_change": 0.0,
                    "orig_balance_zero": 0,
                    "dest_balance_zero": 1,
                    "type_TRANSFER": 0,
                }
            },
            {
                "features": [
                    1,
                    9839.64,
                    170136.0,
                    160296.36,
                    0.0,
                    0.0,
                    1,
                    1,
                    0.0578,
                    9839.64,
                    0.0,
                    0,
                    1,
                    0,
                ]
            },
        ],
    ),
) -> PredictionResponse:
    return predict_model("general", request)


@app.post(
    "/predict/fraud",
    response_model=PredictionResponse,
    responses={200: {"description": "Successful prediction"}},
    summary="Predict fraud",
    description="Run inference with fraud_detection_model.pkl.",
)
async def predict_fraud(
    request: PredictionRequest = Body(
        ...,
        examples=[
            {
                "features": {
                    "step": 1,
                    "type": "PAYMENT",
                    "amount": 9839.64,
                    "oldbalanceOrg": 170136.0,
                    "newbalanceOrig": 160296.36,
                    "oldbalanceDest": 0.0,
                    "newbalanceDest": 0.0,
                    "isFlaggedFraud": 0,
                }
            },
            {"features": [1, "PAYMENT", 9839.64, 170136.0, 160296.36, 0.0, 0.0, 0]},
        ],
    ),
) -> PredictionResponse:
    return predict_model("fraud", request)


@app.post(
    "/predict/credit_card",
    response_model=PredictionResponse,
    responses={200: {"description": "Successful prediction"}},
    summary="Predict credit card fraud",
    description="Run inference with credit_card_model.pkl.",
)
async def predict_credit_card(
    request: PredictionRequest = Body(
        ...,
        examples=[
            {
                "features": {
                    "V1": -1.359807,
                    "V2": -0.072781,
                    "V3": 2.536347,
                    "V4": 1.378155,
                    "V5": -0.338321,
                    "V6": 0.462388,
                    "V7": 0.239599,
                    "V8": 0.098698,
                    "V9": 0.363787,
                    "V10": 0.090794,
                    "V11": -0.5516,
                    "V12": -0.617801,
                    "V13": -0.99139,
                    "V14": -0.311169,
                    "V15": 1.468177,
                    "V16": -0.470401,
                    "V17": 0.207971,
                    "V18": 0.025791,
                    "V19": 0.403993,
                    "V20": 0.251412,
                    "V21": -0.018307,
                    "V22": 0.277838,
                    "V23": -0.110474,
                    "V24": 0.066928,
                    "V25": 0.128539,
                    "V26": -0.189115,
                    "V27": 0.133558,
                    "V28": -0.021053,
                    "Amount": 149.62,
                }
            },
            {
                "features": [
                    -1.359807,
                    -0.072781,
                    2.536347,
                    1.378155,
                    -0.338321,
                    0.462388,
                    0.239599,
                    0.098698,
                    0.363787,
                    0.090794,
                    -0.5516,
                    -0.617801,
                    -0.99139,
                    -0.311169,
                    1.468177,
                    -0.470401,
                    0.207971,
                    0.025791,
                    0.403993,
                    0.251412,
                    -0.018307,
                    0.277838,
                    -0.110474,
                    0.066928,
                    0.128539,
                    -0.189115,
                    0.133558,
                    -0.021053,
                    149.62,
                ]
            },
        ],
    ),
) -> PredictionResponse:
    return predict_model("credit_card", request)
