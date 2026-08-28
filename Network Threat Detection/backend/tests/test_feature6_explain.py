from __future__ import annotations

from backend.app.explainability import explain_current_threat
from backend.app.state import build_canonical_states
from backend.tests.test_feature1_current_threat import _scan_records


def test_explain_current_threat_returns_real_contributions() -> None:
    states = build_canonical_states(
        _scan_records(),
        window_seconds=10,
        dataset="Synthetic",
        scenario="feature-6",
        capture_id="unit",
        split="demo",
    )
    result = explain_current_threat(states)

    assert result["status"] == "success"
    assert result["method"] == "shapley_permutation"
    assert result["contributions"]
    assert result["current_risk"] > 0
    top = result["contributions"][0]
    assert "contribution_pct" in top
    assert top["feature"]
    assert all("contribution_pct" in item for item in result["contributions"])
