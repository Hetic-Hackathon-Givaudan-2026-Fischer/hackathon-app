import logging

import pytest

from app.core.indicators import INDICATORS, Source
from app.services.ports import (
    ConfusionMatrix,
    ModelMetrics,
    ModelScore,
    Origin,
    QualityMetric,
    QualityStatus,
    TrendRecord,
)
from app.services.traceability import (
    MODEL_UNAVAILABLE,
    TraceabilityService,
    grade,
    missing_rate,
    overall_status,
    provided_indicators,
    source_quality,
    without_products,
)
from tests.fakes import FakeModelMetrics, FakeTrendSource, make_status, make_trend

FULL = make_trend("full", **{i.key: 1.0 for i in INDICATORS})
EMPTY = make_trend("empty")
METRICS = ModelMetrics(
    models=(
        ModelScore(
            "V2",
            None,
            0.82,
            0.77,
            0.68,
            f1=0.88,
            confusion=ConfusionMatrix(54, 9, 6, 13),
        ),
    ),
    validation="leave-one-flavor-out",
)


def service(
    trends: list, origin: Origin = "data_ai", metrics: ModelMetrics | None = None
) -> TraceabilityService:
    return TraceabilityService(
        FakeTrendSource(trends, origin=origin), FakeModelMetrics(metrics)
    )


@pytest.mark.parametrize(
    ("value", "expected"), [(0.0, "ok"), (0.1, "ok"), (0.2, "warning"), (0.5, "error")]
)
def test_grade(value: float, expected: str) -> None:
    assert grade(value) == expected


def test_missing_rate_is_computed_on_data() -> None:
    assert missing_rate([FULL, EMPTY], ["wiki_vues_30j"]) == 0.5
    assert missing_rate([FULL], ["wiki_vues_30j", "likes_30j"]) == 0.0
    # Aucune donnée : tout manque
    assert missing_rate([], ["wiki_vues_30j"]) == 1.0


def test_only_provided_indicators_are_judged() -> None:
    # Comme le CSV : aucun indicateur Google Trends
    csv_like = make_trend("csv", produits_total=3.0)
    del_keys = {i.key for i in INDICATORS if i.source == Source.GOOGLE_TRENDS}
    trend = TrendRecord(
        csv_like.id,
        csv_like.name,
        csv_like.family,
        {k: v for k, v in csv_like.indicators.items() if k not in del_keys},
    )

    provided = provided_indicators([trend])

    assert del_keys.isdisjoint(i.key for i in provided)
    assert Source.GOOGLE_TRENDS not in {i.source for i in provided}
    keys = {m.key for m in source_quality([trend], provided)}
    assert "missing:google_trends" not in keys


def test_without_products_counts_zero_and_missing() -> None:
    zero = make_trend("zero", produits_total=0.0)

    assert without_products([FULL, zero, EMPTY]).value == round(2 / 3, 4)


def metric(status: QualityStatus) -> QualityMetric:
    return QualityMetric("k", "label", 0.0, 0.1, status)


@pytest.mark.parametrize(
    ("status", "origin", "expected"),
    [
        ("ok", "data_ai", "ok"),
        ("ok", "csv_fallback", "warning"),
        ("warning", "data_ai", "warning"),
        ("error", "csv_fallback", "error"),
    ],
)
def test_overall_status(status: QualityStatus, origin: Origin, expected: str) -> None:
    assert overall_status([metric(status)], make_status(origin)) == expected


async def test_dataset_report_from_data_ai() -> None:
    report = await service([FULL]).dataset_report()

    assert report.provenance.model_applied is True
    assert report.status == "ok"
    assert [step.name for step in report.steps][1:3] == ["Modèle V1", "Modèle V2"]
    assert report.trend_count == 1
    assert len(report.indicators) == len(INDICATORS)


async def test_dataset_report_in_csv_fallback_says_no_model() -> None:
    report = await service([FULL, EMPTY], origin="csv_fallback").dataset_report()

    assert report.provenance.origin == "csv_fallback"
    assert report.provenance.model_applied is False
    assert "Aucun modèle appliqué" in report.steps[-1].description
    assert report.status == "error"  # la moitié des valeurs manque


async def test_trend_report_grades_each_source() -> None:
    report = await service([EMPTY]).trend_report("empty")

    assert {metric.status for metric in report.quality} == {"error"}
    assert report.trend.id == "empty"


async def test_model_report_available() -> None:
    report = await service([], metrics=METRICS).model_report()

    assert (report.available, report.metrics) == (True, METRICS)


async def test_model_report_unavailable_is_explicit(
    caplog: pytest.LogCaptureFixture,
) -> None:
    with caplog.at_level(logging.WARNING):
        report = await service([]).model_report()

    assert (report.available, report.reason, report.metrics) == (
        False,
        MODEL_UNAVAILABLE,
        None,
    )
    assert "ConnectError" in caplog.text
