import pytest

from app.services.ports import TrendRecord
from app.services.trends import (
    TrendQuery,
    TrendService,
    family_stats,
    filter_trends,
    fold,
    paginate,
    sort_trends,
    summarize,
)
from tests.fakes import FakeTrendSource, make_trend

ACAI = make_trend(
    "acai", "fruits", "buzz", 0.4, "Açaï",
    wiki_croissance_12m_relative=10.0, wiki_vues_30j=100.0, produits_total=5.0,
)  # fmt: skip
MANGO = make_trend(
    "mango", "fruits", "emergent", 0.9, "Mangue",
    wiki_croissance_12m_relative=30.0, wiki_vues_30j=50.0,
)  # fmt: skip
CUMIN = make_trend(
    "cumin", "epice", None, None, "Cumin", wiki_croissance_12m_relative=None
)
TRENDS = [ACAI, MANGO, CUMIN]


def ids(trends: list) -> list[str]:
    return [trend.id for trend in trends]


def test_fold_ignores_case_and_accents() -> None:
    assert fold("Açaï") == fold("ACAI") == "acai"


@pytest.mark.parametrize(
    ("query", "expected"),
    [
        (TrendQuery(family="fruits"), ["acai", "mango"]),
        (TrendQuery(status="emergent"), ["mango"]),
        (TrendQuery(search="acai"), ["acai"]),
        (TrendQuery(search="MAN"), ["mango"]),
        (TrendQuery(family="fruits", search="cumin"), []),
        (TrendQuery(), ["acai", "mango", "cumin"]),
    ],
)
def test_filter(query: TrendQuery, expected: list[str]) -> None:
    assert ids(filter_trends(TRENDS, query)) == expected


@pytest.mark.parametrize("descending", [True, False])
def test_sort_puts_missing_values_last(descending: bool) -> None:
    ordered = sort_trends(TRENDS, "wiki_croissance_12m_relative", descending)

    expected = ["mango", "acai"] if descending else ["acai", "mango"]
    assert ids(ordered) == [*expected, "cumin"]


def test_sort_by_name_and_score() -> None:
    assert ids(sort_trends(TRENDS, "name", False)) == ["acai", "cumin", "mango"]
    assert ids(sort_trends(TRENDS, "score", True)) == ["mango", "acai", "cumin"]


def test_paginate() -> None:
    page = paginate(TRENDS, page=2, page_size=2)

    assert (ids(page.items), page.total) == (["cumin"], 3)
    assert paginate(TRENDS, page=5, page_size=2).items == []


def test_family_stats_average_growth() -> None:
    stats = {stat.family: stat for stat in family_stats(TRENDS)}

    assert (stats["fruits"].trend_count, stats["fruits"].average_growth) == (2, 20.0)
    assert stats["epice"].average_growth is None


def test_summary_kpis() -> None:
    summary = summarize(TRENDS)

    assert (summary.trend_count, summary.family_count) == (3, 2)
    assert summary.scored_count == 2
    assert summary.status_counts == {"buzz": 1, "emergent": 1}
    assert summary.totals["produits_total"] == 5.0
    assert "wiki_vues_30j" not in summary.totals
    assert ids(summary.top_growing) == ["mango", "acai", "cumin"]


def test_totals_skip_indicators_the_source_lacks() -> None:
    bare = TrendRecord("x", "X", "epice", {"produits_total": 2.0})

    assert summarize([bare]).totals == {"produits_total": 2.0}


def test_summary_without_model_has_no_status() -> None:
    summary = summarize([CUMIN])

    assert (summary.scored_count, summary.status_counts) == (0, {})


async def test_service_keeps_origin_and_paginates() -> None:
    service = TrendService(FakeTrendSource(TRENDS, origin="data_ai"))

    result = await service.search(TrendQuery(page_size=1))

    assert result.status.origin == "data_ai"
    assert (ids(result.value.items), result.value.total) == (["mango"], 3)
    assert (await service.summary()).value.trend_count == 3
    assert len((await service.families()).value) == 2
