"""RandomForest wrapper used by the original ANTCM notebook."""

from __future__ import annotations

from typing import Any

from sklearn.ensemble import RandomForestClassifier


class RandomForest:
    """Preserve the pickle module path used by `antcm.ipynb`."""

    def __init__(self, n_estimators: int = 100, **kwargs: Any) -> None:
        self.n_estimators = n_estimators
        self.kwargs = kwargs
        self.cls = RandomForestClassifier(n_estimators=n_estimators, **kwargs)

    def fit(self, x: Any, y: Any) -> "RandomForest":
        self.cls.fit(x, y)
        return self

    def predict(self, x: Any) -> Any:
        return self.cls.predict(x)

    def predict_proba(self, x: Any) -> Any:
        return self.cls.predict_proba(x)

