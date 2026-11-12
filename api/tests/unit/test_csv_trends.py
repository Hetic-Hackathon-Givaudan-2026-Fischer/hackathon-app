from datetime import date
from pathlib import Path

import pytest

from app.clients.csv_trends import (
    CSV_PATH,
    CsvTrendSource,
    clean_header,
    load_trends,
    parse_number,
)
from app.core.errors import NotFoundError
from app.core.indicators import INDICATORS, Source

# Le CSV ne contient pas Google Trends (API Data/IA seulement)
CSV_KEYS = {i.key for i in INDICATORS if i.source != Source.GOOGLE_TRENDS}


@pytest.mark.parametrize(
    ("header", "expected"),
    [
        ("mS#arome_id", "arome_id"),
        ("D#famille", "famille"),
        ("C#likes_30j", "likes_30j"),
    ],
)
def test_clean_header_drops_type_prefix(header: str, expected: str) -> None:
    assert clean_header(header) == expected


@pytest.mark.parametrize(
    ("value", "expected"), [("", None), ("  ", None), ("4.5", 4.5)]
)
def test_parse_number(value: str, expected: float | None) -> None:
    assert parse_number(value) == expected


def test_real_csv_has_102_trends_with_every_indicator() -> None:
    trends = load_trends(CSV_PATH)

    assert len(trends) == 102
    assert all(set(t.indicators) == CSV_KEYS for t in trends)
    assert all(t.status is None and t.score is None for t in trends)


def test_empty_cells_become_none(tmp_path: Path) -> None:
    path = tmp_path / "mini.csv"
    path.write_text(
        "mS#arome_id,mS#arome,D#famille,C#wiki_vues_30j,C#likes_30j\n"
        "acai,Açaï,fruits_exotiques,,12\n",
        encoding="utf-8",
    )

    [trend] = load_trends(path)

    assert (trend.id, trend.name, trend.family) == ("acai", "Açaï", "fruits_exotiques")
    assert trend.indicators["wiki_vues_30j"] is None
    assert trend.indicators["likes_30j"] == 12.0
    # Colonne absente du fichier : indicateur non fourni (clé absente), pas vide
    assert "pinterest_tendances_30j" not in trend.indicators


async def test_source_reports_csv_origin_and_finds_trends() -> None:
    source = CsvTrendSource(data_date=date(2026, 11, 1))

    result = await source.get_trend("acai")

    assert result.value.name == "Açaï"
    assert result.status.origin == "csv_fallback"
    assert result.status.data_date == date(2026, 11, 1)
    assert len((await source.list_trends()).value) == 102


async def test_unknown_trend_is_not_found() -> None:
    with pytest.raises(NotFoundError):
        await CsvTrendSource().get_trend("inconnu")
