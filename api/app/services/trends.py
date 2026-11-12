"""Dashboard : filtres, tri, pagination et KPI des tendances.

Tout se calcule ici, jamais chez la source : mêmes résultats que les données
viennent de l'API Data/IA ou du CSV de repli.
"""

import unicodedata
from collections import Counter, defaultdict
from collections.abc import Iterable
from dataclasses import dataclass
from statistics import fmean

from app.core.indicators import GROWTH_INDICATOR, INDICATOR_KEYS
from app.services.ports import Sourced, TrendRecord, TrendSource

# Scores des indicateurs métier Data/IA (`TrendAnalysis`), triables eux aussi
ANALYSIS_SORT_FIELDS = ("buzz_score", "trend_score")
SORT_FIELDS: tuple[str, ...] = (
    "name",
    "score",
    *ANALYSIS_SORT_FIELDS,
    *INDICATOR_KEYS,
)
# Indicateurs additionnés dans les KPI, s'ils sont fournis par la source
SUMMED_INDICATORS = (
    "produits_total",
    "mentions_presse_30j",
    "mentions_reseaux_30j",
)
TOP_GROWING_SIZE = 5


@dataclass(frozen=True, slots=True)
class TrendQuery:
    family: str | None = None
    status: str | None = None
    product_type: str | None = None
    search: str | None = None
    sort: str = GROWTH_INDICATOR
    descending: bool = True
    page: int = 1
    page_size: int = 20


@dataclass(frozen=True, slots=True)
class TrendPage:
    items: list[TrendRecord]
    total: int
    page: int
    page_size: int


@dataclass(frozen=True, slots=True)
class FamilyStat:
    family: str
    trend_count: int
    average_growth: float | None


@dataclass(frozen=True, slots=True)
class ProductTypeStat:
    """Un type de produit : arômes dont c'est le type principal, ou l'un des types."""

    id: str
    label: str
    main_count: int
    any_count: int


@dataclass(frozen=True, slots=True)
class DashboardSummary:
    trend_count: int
    family_count: int
    scored_count: int
    status_counts: dict[str, int]
    totals: dict[str, float]
    top_growing: list[TrendRecord]


def fold(text: str) -> str:
    """Minuscules, sans accents : « Açaï » et « acai » se retrouvent."""
    decomposed = unicodedata.normalize("NFKD", text)
    return "".join(c for c in decomposed if not unicodedata.combining(c)).casefold()


def _has_product_type(trend: TrendRecord, product_type: str) -> bool:
    """Type principal ou secondaire, comme le filtre `category` de Data/IA."""
    return trend.main_product_type == product_type or any(
        share.id == product_type for share in trend.product_types
    )


def _matches(trend: TrendRecord, query: TrendQuery) -> bool:
    if query.family and trend.family != query.family:
        return False
    if query.status and trend.status != query.status:
        return False
    if query.product_type and not _has_product_type(trend, query.product_type):
        return False
    needle = fold(query.search or "")
    return not needle or needle in fold(trend.name) or needle in fold(trend.id)


def filter_trends(
    trends: Iterable[TrendRecord], query: TrendQuery
) -> list[TrendRecord]:
    return [trend for trend in trends if _matches(trend, query)]


def _sort_value(trend: TrendRecord, field: str) -> float | str | None:
    if field == "name":
        return fold(trend.name)
    if field == "score":
        return trend.score
    if field in ANALYSIS_SORT_FIELDS:
        return getattr(trend.analysis, field) if trend.analysis else None
    return trend.indicators.get(field)


def sort_trends(
    trends: Iterable[TrendRecord], field: str, descending: bool
) -> list[TrendRecord]:
    """Tri sur `field` ; les valeurs absentes toujours en dernier."""
    trends = list(trends)
    present = [t for t in trends if _sort_value(t, field) is not None]
    missing = [t for t in trends if _sort_value(t, field) is None]
    present.sort(key=lambda t: _sort_value(t, field), reverse=descending)  # type: ignore[arg-type, return-value]
    return present + missing


def paginate(trends: list[TrendRecord], page: int, page_size: int) -> TrendPage:
    start = (page - 1) * page_size
    items = trends[start : start + page_size]
    return TrendPage(items=items, total=len(trends), page=page, page_size=page_size)


def _average(values: Iterable[float | None]) -> float | None:
    present = [value for value in values if value is not None]
    return round(fmean(present), 2) if present else None


def family_stats(trends: Iterable[TrendRecord]) -> list[FamilyStat]:
    by_family: defaultdict[str, list[TrendRecord]] = defaultdict(list)
    for trend in trends:
        by_family[trend.family].append(trend)
    return [
        FamilyStat(
            family=family,
            trend_count=len(members),
            average_growth=_average(
                t.indicators.get(GROWTH_INDICATOR) for t in members
            ),
        )
        for family, members in sorted(by_family.items())
    ]


def product_type_stats(trends: Iterable[TrendRecord]) -> list[ProductTypeStat]:
    """Types de produits présents, les plus fréquents d'abord ; vide en repli CSV."""
    labels: dict[str, str] = {}
    present: Counter[str] = Counter()
    main: Counter[str | None] = Counter()
    for trend in trends:
        main[trend.main_product_type] += 1
        for share in trend.product_types:
            labels.setdefault(share.id, share.label)
            present[share.id] += 1
    stats = [
        ProductTypeStat(type_id, label, main[type_id], present[type_id])
        for type_id, label in labels.items()
    ]
    return sorted(stats, key=lambda stat: (-stat.any_count, stat.label))


def _total(trends: list[TrendRecord], key: str) -> float:
    return sum(t.indicators.get(key) or 0.0 for t in trends)


def summarize(trends: list[TrendRecord]) -> DashboardSummary:
    statuses = Counter(t.status for t in trends if t.status is not None)
    return DashboardSummary(
        trend_count=len(trends),
        family_count=len({t.family for t in trends}),
        scored_count=sum(statuses.values()),
        status_counts=dict(sorted(statuses.items())),
        totals={
            key: _total(trends, key)
            for key in SUMMED_INDICATORS
            if any(key in t.indicators for t in trends)
        },
        top_growing=sort_trends(trends, GROWTH_INDICATOR, True)[:TOP_GROWING_SIZE],
    )


class TrendService:
    """Consultation des tendances pour le dashboard."""

    def __init__(self, source: TrendSource) -> None:
        self._source = source

    async def search(self, query: TrendQuery) -> Sourced[TrendPage]:
        result = await self._source.list_trends()
        matching = filter_trends(result.value, query)
        ordered = sort_trends(matching, query.sort, query.descending)
        return Sourced(paginate(ordered, query.page, query.page_size), result.status)

    async def get(self, trend_id: str) -> Sourced[TrendRecord]:
        return await self._source.get_trend(trend_id)

    async def families(self) -> Sourced[list[FamilyStat]]:
        result = await self._source.list_trends()
        return Sourced(family_stats(result.value), result.status)

    async def product_types(self) -> Sourced[list[ProductTypeStat]]:
        result = await self._source.list_trends()
        return Sourced(product_type_stats(result.value), result.status)

    async def summary(self) -> Sourced[DashboardSummary]:
        result = await self._source.list_trends()
        return Sourced(summarize(result.value), result.status)
