import logging

import pytest

from app.clients.fallback import FallbackTrendSource, UnavailableModelMetrics
from app.core.errors import DataSourceUnavailableError, NotFoundError
from tests.fakes import FakeTrendSource, make_trend

TRENDS = [make_trend("acai")]


def fallback(primary_fails: bool) -> tuple[FallbackTrendSource, FakeTrendSource]:
    primary = FakeTrendSource(TRENDS, origin="data_ai", fail=primary_fails)
    csv = FakeTrendSource(TRENDS, origin="csv_fallback")
    return FallbackTrendSource(primary, csv), csv


async def test_uses_primary_when_it_answers() -> None:
    source, csv = fallback(primary_fails=False)

    assert (await source.list_trends()).status.origin == "data_ai"
    assert (await source.get_trend("acai")).status.origin == "data_ai"
    assert csv.calls == 0


async def test_falls_back_and_logs_cause(caplog: pytest.LogCaptureFixture) -> None:
    source, _ = fallback(primary_fails=True)

    with caplog.at_level(logging.WARNING):
        result = await source.list_trends()

    assert result.status.origin == "csv_fallback"
    assert "bascule sur le CSV" in caplog.text
    assert "ConnectError" in caplog.text


async def test_every_method_falls_back() -> None:
    source, _ = fallback(primary_fails=True)

    assert (await source.data_status()).origin == "csv_fallback"
    assert (await source.get_trend("acai")).status.origin == "csv_fallback"


async def test_not_found_from_primary_is_not_a_failure() -> None:
    source, csv = fallback(primary_fails=False)

    with pytest.raises(NotFoundError):
        await source.get_trend("inconnu")
    assert csv.calls == 0


async def test_unavailable_model_metrics_raises() -> None:
    with pytest.raises(DataSourceUnavailableError):
        await UnavailableModelMetrics().model_metrics()
