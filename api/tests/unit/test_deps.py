from types import SimpleNamespace

import httpx
from fastapi import Request

from app.api.deps import (
    get_csv_trend_source,
    get_data_ai_http,
    get_data_ai_trend_source,
    get_model_metrics_source,
    get_simulator,
    get_trend_source,
)
from app.clients.csv_trends import CsvTrendSource
from app.clients.data_trends import DataTeamModelMetrics, DataTeamSimulator
from app.clients.fallback import (
    FallbackTrendSource,
    UnavailableModelMetrics,
    UnavailableSimulator,
)
from app.core.config import Settings
from app.services.ports import TrendSource


def settings(**overrides: object) -> Settings:
    values = {"database_url": "postgres://app:app@db:5432/app"}
    return Settings(_env_file=None, **(values | overrides))  # type: ignore[arg-type]


def trend_source(**overrides: object) -> TrendSource:
    client = get_data_ai_http(settings(**overrides), _request())
    return get_trend_source(get_data_ai_trend_source(client))


def _request() -> Request:
    app = SimpleNamespace(state=SimpleNamespace(http=httpx.AsyncClient()))
    return Request({"type": "http", "app": app})


def test_trend_source_is_csv_alone_without_data_ai_url() -> None:
    assert isinstance(trend_source(), CsvTrendSource)
    assert get_data_ai_http(settings(), _request()) is None


def test_trend_source_falls_back_to_csv_with_data_ai_url() -> None:
    source = trend_source(data_ai_url="https://x.ngrok.app")

    assert isinstance(source, FallbackTrendSource)


def test_model_metrics_source_follows_data_ai_url() -> None:
    client = get_data_ai_http(settings(data_ai_url="https://x.ngrok.app"), _request())

    assert isinstance(get_model_metrics_source(client), DataTeamModelMetrics)
    assert isinstance(get_model_metrics_source(None), UnavailableModelMetrics)
    assert isinstance(get_simulator(client), DataTeamSimulator)
    assert isinstance(get_simulator(None), UnavailableSimulator)


def test_csv_source_is_read_once() -> None:
    assert get_csv_trend_source() is get_csv_trend_source()
