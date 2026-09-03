"""Compatibility loader for the notebook-trained ANTCM pickle.

The saved artifact references classes created in `antcm.ipynb` under
`__main__`. This module recreates those class names so pickle loading can happen
inside the backend instead of only inside the notebook.
"""

from __future__ import annotations

import pickle
import sys
from pathlib import Path
from typing import Any

import numpy as np

try:  # PyTorch is optional until temporal model inference is enabled.
    import torch
    import torch.nn as nn
except ModuleNotFoundError as exc:  # pragma: no cover - exercised in dependency-light envs
    torch = None
    nn = None
    TORCH_IMPORT_ERROR = exc
else:
    TORCH_IMPORT_ERROR = None


if nn is not None:

    class SubNet(nn.Module):
        def __init__(self, input_size: int, layers_dims: list[int] | None = None) -> None:
            super().__init__()
            layers_dims = layers_dims or [50, 30]
            self.input_size = input_size
            self.layers_dims = [input_size] + list(layers_dims) + [1]
            self.net = nn.Sequential(
                *[nn.Linear(self.layers_dims[i - 1], self.layers_dims[i]) for i in range(1, len(self.layers_dims))]
            )
            self.kernel_weights = nn.Parameter(torch.randn(1, input_size, requires_grad=True))
            self.encoder = None
            self.outputs = None

        def forward(self, x: Any) -> Any:
            for layer in list(self.net)[:-1]:
                x = torch.tanh(layer(x))
            x = torch.sigmoid(self.net[-1](x))
            self.outputs = x
            return x


    class Encoder(nn.Module):
        def __init__(self, layers_dims: tuple[int, ...] = (60, 40, 20)) -> None:
            super().__init__()
            self.layers_dims = layers_dims
            self.input_shape = None
            self.layers = []
            self.net = None
            self.outputs = None
            self.sinWeights = nn.ParameterList([])
            self.sinCoeffs = nn.ParameterList([])

        def forward(self, x: Any, save: bool = True) -> Any:
            if self.net is None:
                dims = [x.shape[-1]] + list(self.layers_dims)
                self.net = nn.Sequential(*[nn.Linear(dims[i - 1], dims[i]) for i in range(1, len(dims))])
            for layer in list(self.net)[:-1]:
                x = torch.sin(layer(x))
            x = self.net[-1](x)
            if save:
                self.outputs = x
            return x


    class AdaptiveClustering(nn.Module):
        def __init__(
            self,
            encoder_dims: list[int] | tuple[int, ...] = (60, 40, 20),
            kernel_size: int = 3,
            n_kernels: int | None = None,
            subnet_dims: list[int] | None = None,
        ) -> None:
            super().__init__()
            self.kernel_size = kernel_size
            self.n_kernels = n_kernels
            self.subnet_dims = subnet_dims or [50, 30]
            self.encoder_dims = list(encoder_dims) + [kernel_size]
            self.labels_ = None
            self.sub_nets_list = []
            self.sub_nets = nn.ModuleList([])
            self.classifier = None

        @property
        def n_kernels_(self) -> int:
            return len(self.sub_nets)

        def forward(self, x: Any, labels: Any | None = None) -> Any:
            outputs = []
            for sub_net in self.sub_nets:
                embeddings = sub_net.encoder(x) if sub_net.encoder is not None else x
                outputs.append(sub_net(embeddings).view(embeddings.shape[0], 1, -1))
            return torch.softmax(torch.cat(tuple(outputs), 1), dim=1) if outputs else x


else:

    class SubNet:  # type: ignore[no-redef]
        pass


    class Encoder:  # type: ignore[no-redef]
        pass


    class AdaptiveClustering:  # type: ignore[no-redef]
        pass


class AntcmModel:
    """Small wrapper around the notebook artifact's Random Forest classifier."""

    def __init__(self, artifact: Any) -> None:
        self.artifact = artifact
        self.classifier = getattr(artifact, "classifier", None)
        self.inner_classifier = getattr(self.classifier, "cls", self.classifier)
        if self.inner_classifier is None or not hasattr(self.classifier, "predict"):
            raise TypeError("ANTCM artifact does not expose classifier.predict")

    @property
    def expected_feature_count(self) -> int | None:
        return getattr(self.inner_classifier, "n_features_in_", None)

    @property
    def classes(self) -> list[Any] | None:
        classes = getattr(self.inner_classifier, "classes_", None)
        return None if classes is None else list(classes)

    def predict(self, features: list[list[float]] | np.ndarray) -> np.ndarray:
        matrix = np.asarray(features, dtype=float)
        if matrix.ndim == 1:
            matrix = matrix.reshape(1, -1)
        expected = self.expected_feature_count
        if expected is not None and matrix.shape[1] != expected:
            raise ValueError(f"ANTCM expects {expected} features, received {matrix.shape[1]}")
        return np.asarray(self.classifier.predict(matrix.tolist()))

    def predict_proba(self, features: list[list[float]] | np.ndarray) -> np.ndarray | None:
        predictor = getattr(self.classifier, "predict_proba", None)
        if predictor is None:
            predictor = getattr(self.inner_classifier, "predict_proba", None)
        if predictor is None:
            return None
        matrix = np.asarray(features, dtype=float)
        if matrix.ndim == 1:
            matrix = matrix.reshape(1, -1)
        return np.asarray(predictor(matrix.tolist()))


def _register_notebook_classes() -> None:
    main = sys.modules["__main__"]
    setattr(main, "SubNet", SubNet)
    setattr(main, "Encoder", Encoder)
    setattr(main, "AdaptiveClustering", AdaptiveClustering)


def load_antcm_model(path: str | Path) -> AntcmModel:
    if TORCH_IMPORT_ERROR is not None:
        raise ModuleNotFoundError("PyTorch is required to load ANTCM_trained_model.pkl") from TORCH_IMPORT_ERROR
    _register_notebook_classes()
    original_torch_load = torch.load

    def _cpu_torch_load(*args: Any, **kwargs: Any) -> Any:
        kwargs.setdefault("map_location", torch.device("cpu"))
        return original_torch_load(*args, **kwargs)

    torch.load = _cpu_torch_load
    try:
        with Path(path).open("rb") as stream:
            artifact = pickle.load(stream)
    finally:
        torch.load = original_torch_load
    return AntcmModel(artifact)
