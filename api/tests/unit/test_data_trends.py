"""Client Data/IA sur les réponses de référence de tests/fixtures/data_ai/."""

import json
from collections.abc import Callable
from datetime import date
from pathlib import Path
from typing import Any

import httpx
import pytest
from pydantic import SecretStr

from app.clients.data_ai_http import DataAiHttp
from app.clients.data_trends import (
    METRIC_KEYS,
    DataTeamModelMetrics,
    DataTeamTrendSource,
)
from app.core.errors import DataSourceUnavailableError, NotFoundError

FIXTURES = Path(__file__).resolve().parents[1] / "fixtures" / "data_ai"
BASE_URL = "https://x.ngrok.app"
DATA_DATE = date(2026, 11, 12)
Handler = Callable[[httpx.Request], httpx.Response]


def fixture(name: str) -> Any:
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def http(handler: Handler, key: str = "k") -> DataAiHttp:
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    return DataAiHttp(client, BASE_URL, SecretStr(key), timeout=5)


def serve(name: str) -> Handler:
    return lambda _: httpx.Response(200, json=fixture(name))


def source(handler: Handler) -> DataTeamTrendSource:
    return DataTeamTrendSource(http(handler))


async def test_list_maps_trends_and_status() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/api/v1/trends"
        assert request.url.params["include_series"] == "false"
        assert request.headers["X-API-Key"] == "k"
        return httpx.Response(200, json=fixture("trends.json"))

    result = await source(handler).list_trends()

    curry = result.value[0]
    assert (curry.id, curry.name, curry.family) == ("curry", "Curry", "epice")
    assert curry.status == "En hausse : probablement passager (buzz)"
    assert (curry.v1_verdict, curry.confidence) == ("buzz", "haute")
    assert (curry.score, curry.aisle) == (13.0, "Épicerie salée & sauces")
    assert curry.indicators["recherche_pic_ratio"] == 3.82
    assert curry.indicators["produits_total"] == 361.0
    assert (result.status.origin, result.status.data_date) == ("data_ai", DATA_DATE)


async def test_metrics_map_to_our_keys_only() -> None:
    result = await source(serve("trends.json")).list_trends()

    keys = set(result.value[0].indicators)
    assert keys == set(METRIC_KEYS.values())
    # Non numérique : ce n'est pas un indicateur
    assert "efsa_regulatory_status" not in keys


async def test_low_search_volume_leaves_google_trends_empty() -> None:
    result = await source(serve("trends.json")).list_trends()

    [low] = [t for t in result.value if t.id == "bergamot"]
    assert low.status == "Volume de recherche trop faible pour conclure"
    assert low.indicators["recherche_croissance_13s_pct"] is None


async def test_detail_reads_series_evidence_and_date_from_health() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        name = (
            "health.json" if request.url.path.endswith("health") else "trend_curry.json"
        )
        return httpx.Response(200, json=fixture(name))

    result = await source(handler).get_trend("curry")

    trend = result.value
    assert len(trend.series) == 104
    assert trend.series[0].period == date(2024, 11, 10)
    assert trend.evidence[0].source == "google_news"
    assert trend.watch_points
    assert result.status.data_date == DATA_DATE


async def test_health_and_model_metrics() -> None:
    status = await source(serve("health.json")).data_status()
    metrics_source = DataTeamModelMetrics(http(serve("model_metrics.json")))
    metrics = await metrics_source.model_metrics()

    assert status.data_date == DATA_DATE
    assert [m.version for m in metrics.models][:2] == ["V2", "V1"]
    v2, v1 = metrics.models[:2]
    assert (v2.balanced_accuracy, v2.buzz_detected, v2.f1) == (0.771, 0.684, 0.878)
    assert v2.confusion is not None
    assert v2.confusion.buzz_predicted_buzz == 13
    assert (v1.balanced_accuracy, v1.f1, v1.confusion) == (0.734, None, None)
    assert metrics.case_count == 82


async def test_empty_key_sends_no_auth_header() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert "X-API-Key" not in request.headers
        return httpx.Response(200, json=fixture("health.json"))

    await DataTeamTrendSource(http(handler, key="")).data_status()


async def test_json_404_on_detail_is_not_found() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(404, json={"detail": "Arôme inconnu : inconnu"})

    with pytest.raises(NotFoundError):
        await source(handler).get_trend("inconnu")


def _raise(exc: Exception) -> Handler:
    def handler(request: httpx.Request) -> httpx.Response:
        raise exc

    return handler


@pytest.mark.parametrize(
    "handler",
    [
        _raise(httpx.ConnectError("refusée")),
        _raise(httpx.ReadTimeout("trop long")),
        lambda _: httpx.Response(503, json={"detail": "down"}),
        lambda _: httpx.Response(401, json={"detail": "bad key"}),
        lambda _: httpx.Response(200, text="<html>pas du JSON</html>"),
        lambda _: httpx.Response(200, json={"inattendu": []}),
        lambda _: httpx.Response(200, json={"trend_id": "acai"}),
        # Tunnel ngrok hors ligne : 404 HTML, pas une réponse de l'API
        lambda _: httpx.Response(
            404, text="<html>offline</html>", headers={"ngrok-error-code": "3200"}
        ),
    ],
    ids=["refus", "timeout", "5xx", "401", "json", "format", "champs", "ngrok"],
)
async def test_failures_become_unavailable(handler: Handler) -> None:
    with pytest.raises(DataSourceUnavailableError):
        await source(handler).get_trend("acai")


async def test_404_on_list_is_unavailable_not_not_found() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(404, json={"detail": "Not Found"})

    with pytest.raises(DataSourceUnavailableError):
        await source(handler).list_trends()


async def test_invalid_url_is_unavailable() -> None:
    client = httpx.AsyncClient()
    bad = DataAiHttp(client, "pas une url", SecretStr(""), timeout=1)

    with pytest.raises(DataSourceUnavailableError):
        await DataTeamTrendSource(bad).list_trends()
