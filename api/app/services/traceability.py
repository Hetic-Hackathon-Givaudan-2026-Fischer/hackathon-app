"""Traçabilité : d'où viennent les données, ce qu'on en a fait, avec quelle qualité.

Les métriques de qualité sont calculées sur les données reçues, jamais écrites
en dur : elles changent avec la source (API Data/IA ou CSV de repli).
"""

import logging
from collections.abc import Iterable
from dataclasses import dataclass

from app.core.errors import DataSourceUnavailableError
from app.core.indicators import (
    INDICATORS,
    PRODUCTS_INDICATOR,
    SOURCE_LABELS,
    IndicatorSource,
    Source,
)
from app.services.ports import (
    DataProvenance,
    DataStatus,
    ModelMetrics,
    ModelMetricsSource,
    ProcessingStep,
    QualityMetric,
    QualityStatus,
    TrendRecord,
    TrendSource,
)

logger = logging.getLogger(__name__)

# Part de valeurs manquantes : au-delà de WARNING → warning, de ERROR → error
MISSING_WARNING = 0.10
MISSING_ERROR = 0.30
MODEL_UNAVAILABLE = (
    "Métriques du modèle indisponibles : l'API Data/IA est injoignable ou non "
    "configurée. Les données servies sont des indicateurs bruts, sans modèle."
)

DATA_AI_STEPS = (
    ProcessingStep(
        2,
        "Modèle V1",
        "V1",
        "Règle simple : buzz si le pic récent "
        "dépasse 1,5 fois la moyenne sur 26 semaines.",
    ),
    ProcessingStep(
        3,
        "Modèle V2",
        "V2",
        "Régression logistique sur la forme de la courbe Google Trends, validée "
        "en leave-one-flavor-out : score de pérennité de 0 à 100.",
    ),
    ProcessingStep(4, "Exposition", None, "API Data/IA « FlavorTrends »."),
)
CSV_STEPS = (
    ProcessingStep(2, "Export CSV", None, "Indicateurs exportés par l'équipe Data/IA."),
    ProcessingStep(
        3,
        "Lecture du CSV",
        None,
        "En-têtes nettoyés, cellules vides → valeurs absentes. Aucun modèle appliqué.",
    ),
)


@dataclass(frozen=True, slots=True)
class DatasetReport:
    provenance: DataProvenance
    indicators: tuple[IndicatorSource, ...]
    steps: tuple[ProcessingStep, ...]
    quality: list[QualityMetric]
    status: QualityStatus
    trend_count: int


@dataclass(frozen=True, slots=True)
class TrendReport:
    provenance: DataProvenance
    trend: TrendRecord
    indicators: tuple[IndicatorSource, ...]
    quality: list[QualityMetric]
    status: QualityStatus


@dataclass(frozen=True, slots=True)
class ModelReport:
    available: bool
    reason: str | None
    metrics: ModelMetrics | None


def provenance(status: DataStatus) -> DataProvenance:
    return DataProvenance(
        origin=status.origin,
        data_date=status.data_date,
        fetched_at=status.fetched_at,
        api_version=status.api_version,
        model_applied=status.origin == "data_ai",
    )


def provided_indicators(trends: list[TrendRecord]) -> tuple[IndicatorSource, ...]:
    """Les indicateurs que la source fournit : seuls ceux-là sont jugés."""
    keys = {key for trend in trends for key in trend.indicators}
    return tuple(i for i in INDICATORS if i.key in keys)


def _sources(indicators: Iterable[IndicatorSource]) -> list[Source]:
    present = {i.source for i in indicators}
    return [source for source in SOURCE_LABELS if source in present]


def processing_steps(
    status: DataStatus, indicators: tuple[IndicatorSource, ...]
) -> tuple[ProcessingStep, ...]:
    labels = ", ".join(SOURCE_LABELS[s] for s in _sources(indicators))
    collect = ProcessingStep(1, "Collecte", None, f"Indicateurs bruts : {labels}.")
    steps = DATA_AI_STEPS if status.origin == "data_ai" else CSV_STEPS
    return (collect, *steps)


def grade(value: float) -> QualityStatus:
    if value > MISSING_ERROR:
        return "error"
    return "warning" if value > MISSING_WARNING else "ok"


def missing_rate(trends: list[TrendRecord], keys: Iterable[str]) -> float:
    """Part des valeurs absentes ; sans aucune donnée, tout manque (1.0)."""
    values = [trend.indicators.get(key) for trend in trends for key in keys]
    if not values:
        return 1.0
    return round(sum(value is None for value in values) / len(values), 4)


def _metric(key: str, label: str, value: float) -> QualityMetric:
    return QualityMetric(
        key=key,
        label=label,
        value=value,
        threshold=MISSING_WARNING,
        status=grade(value),
    )


def source_quality(
    trends: list[TrendRecord], indicators: tuple[IndicatorSource, ...]
) -> list[QualityMetric]:
    return [
        _metric(
            f"missing:{source}",
            f"Valeurs manquantes — {SOURCE_LABELS[source]}",
            missing_rate(trends, [i.key for i in indicators if i.source == source]),
        )
        for source in _sources(indicators)
    ]


def indicator_quality(
    trends: list[TrendRecord], indicators: tuple[IndicatorSource, ...]
) -> list[QualityMetric]:
    return [
        _metric(
            f"missing:{i.key}",
            f"Valeurs manquantes — {i.label}",
            missing_rate(trends, [i.key]),
        )
        for i in indicators
    ]


def without_products(trends: list[TrendRecord]) -> QualityMetric:
    """Part des arômes sans produit en rayon (absent ou zéro)."""
    empty = sum(not t.indicators.get(PRODUCTS_INDICATOR) for t in trends)
    share = round(empty / len(trends), 4) if trends else 1.0
    return _metric("trends_without_products", "Arômes sans produit en rayon", share)


def overall_status(
    metrics: Iterable[QualityMetric], status: DataStatus
) -> QualityStatus:
    """error si une métrique l'est ; warning si l'une l'est ou en repli CSV."""
    statuses = {metric.status for metric in metrics}
    if "error" in statuses:
        return "error"
    if "warning" in statuses or status.origin == "csv_fallback":
        return "warning"
    return "ok"


def dataset_quality(
    trends: list[TrendRecord], indicators: tuple[IndicatorSource, ...]
) -> list[QualityMetric]:
    return [
        *source_quality(trends, indicators),
        *indicator_quality(trends, indicators),
        without_products(trends),
    ]


class TraceabilityService:
    """Assemble provenance, traitements et qualité pour le rapport d'analyse."""

    def __init__(self, source: TrendSource, metrics: ModelMetricsSource) -> None:
        self._source = source
        self._metrics = metrics

    async def dataset_report(self) -> DatasetReport:
        result = await self._source.list_trends()
        indicators = provided_indicators(result.value)
        quality = dataset_quality(result.value, indicators)
        return DatasetReport(
            provenance=provenance(result.status),
            indicators=indicators,
            steps=processing_steps(result.status, indicators),
            quality=quality,
            status=overall_status(quality, result.status),
            trend_count=len(result.value),
        )

    async def trend_report(self, trend_id: str) -> TrendReport:
        result = await self._source.get_trend(trend_id)
        indicators = provided_indicators([result.value])
        quality = source_quality([result.value], indicators)
        return TrendReport(
            provenance=provenance(result.status),
            trend=result.value,
            indicators=indicators,
            quality=quality,
            status=overall_status(quality, result.status),
        )

    async def model_report(self) -> ModelReport:
        try:
            metrics = await self._metrics.model_metrics()
        except DataSourceUnavailableError as exc:
            logger.warning("Métriques du modèle indisponibles : %s", exc)
            return ModelReport(available=False, reason=MODEL_UNAVAILABLE, metrics=None)
        return ModelReport(available=True, reason=None, metrics=metrics)
