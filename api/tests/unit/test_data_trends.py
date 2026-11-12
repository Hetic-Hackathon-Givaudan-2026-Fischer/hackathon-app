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
    DataTeamSimulator,
    DataTeamTrendSource,
)
from app.core.errors import DataSourceUnavailableError, NotFoundError
from app.services.ports import SimulationInput

FIXTURES = Path(__file__).resolve().parents[1] / "fixtures" / "data_ai"
BASE_URL = "https://x.ngrok.app"
DATA_DATE = date(2026, 11, 12)
Handler = Callable[[httpx.Request], httpx.Response]
# Route Data/IA → réponse enregistrée
ROUTES = {
    "/api/v1/health": "health.json",
    "/api/v1/trends": "trends.json",
    "/api/v1/trends/curry": "trend_curry.json",
    "/api/v1/model-metrics": "model_metrics.json",
    "/api/v1/ai/indicators": "ai_indicators.json",
    "/api/v1/simulate": "simulate.json",
}
INDICATORS_PATH = "/api/v1/ai/indicators"


def fixture(name: str) -> Any:
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def http(handler: Handler, key: str = "k") -> DataAiHttp:
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    return DataAiHttp(client, BASE_URL, SecretStr(key), timeout=5)


def serve(name: str) -> Handler:
    return lambda _: httpx.Response(200, json=fixture(name))


def data_ai(*down: str, seen: list[httpx.Request] | None = None) -> Handler:
    """Sert la fixture de chaque route ; les chemins `down` répondent 503."""

    def handler(request: httpx.Request) -> httpx.Response:
        if seen is not None:
            seen.append(request)
        if request.url.path in down:
            return httpx.Response(503, json={"detail": "down"})
        return httpx.Response(200, json=fixture(ROUTES[request.url.path]))

    return handler


def source(handler: Handler) -> DataTeamTrendSource:
    return DataTeamTrendSource(http(handler))


async def test_list_maps_trends_and_status() -> None:
    seen: list[httpx.Request] = []

    result = await source(data_ai(seen=seen)).list_trends()

    [trends] = [r for r in seen if r.url.path == "/api/v1/trends"]
    assert trends.url.params["include_series"] == "false"
    assert trends.headers["X-API-Key"] == "k"
    curry = result.value[0]
    assert (curry.id, curry.name, curry.family) == ("curry", "Curry", "epice")
    assert curry.status == "En hausse : probablement passager (buzz)"
    assert (curry.v1_verdict, curry.confidence) == ("buzz", "haute")
    assert (curry.score, curry.aisle) == (13.0, "Plats préparés et produits traiteur")
    assert curry.indicators["recherche_pic_ratio"] == 3.82
    assert curry.indicators["produits_total"] == 361.0
    assert (result.status.origin, result.status.data_date) == ("data_ai", DATA_DATE)


async def test_list_reads_product_types_and_analysis() -> None:
    result = await source(data_ai()).list_trends()

    curry = result.value[0]
    assert (curry.name_en, curry.main_product_type) == ("Curry", "plats")
    plats = curry.product_types[0]
    assert (plats.id, plats.products, plats.share, plats.basis) == (
        "plats",
        79,
        0.427,
        "produits",
    )
    assert curry.analysis is not None
    assert (curry.analysis.status, curry.analysis.confidence) == ("exploding", "high")
    assert (curry.analysis.buzz_score, curry.analysis.trend_score) == (92, 99)
    assert all(trend.analysis for trend in result.value)


async def test_indicators_outage_keeps_trends_without_analysis() -> None:
    """Les indicateurs métier en panne ne font pas basculer les arômes sur le CSV."""
    result = await source(data_ai(INDICATORS_PATH)).list_trends()

    assert result.status.origin == "data_ai"
    assert result.value
    assert all(trend.analysis is None for trend in result.value)


async def test_metrics_map_to_our_keys_only() -> None:
    result = await source(data_ai()).list_trends()

    keys = set(result.value[0].indicators)
    assert keys == set(METRIC_KEYS.values())
    # Non numérique : ce n'est pas un indicateur
    assert "efsa_regulatory_status" not in keys


async def test_low_search_volume_leaves_google_trends_empty() -> None:
    result = await source(data_ai()).list_trends()

    [low] = [t for t in result.value if t.id == "bergamot"]
    assert low.status == "Volume de recherche trop faible pour conclure"
    assert low.indicators["recherche_croissance_13s_pct"] is None


async def test_detail_reads_series_evidence_and_date_from_health() -> None:
    result = await source(data_ai()).get_trend("curry")

    trend = result.value
    assert len(trend.series) == 104
    assert trend.series[0].period == date(2024, 11, 10)
    assert trend.evidence[0].source == "google_news"
    assert trend.watch_points
    assert trend.analysis is not None
    assert trend.analysis.status == "exploding"
    assert result.status.data_date == DATA_DATE


async def test_unknown_analysis_status_drops_analysis_only() -> None:
    """Valeur hors du Swagger : format inattendu, jamais une 500 chez nous."""
    indicators = fixture("ai_indicators.json")
    indicators[0]["trend_status"] = "viral"

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == INDICATORS_PATH:
            return httpx.Response(200, json=indicators)
        return data_ai()(request)

    result = await source(handler).list_trends()

    assert result.status.origin == "data_ai"
    assert all(trend.analysis is None for trend in result.value)


async def test_detail_keeps_evidence_without_url() -> None:
    """Vidéos YouTube : `url` null chez Data/IA, jamais la chaîne « None »."""
    result = await source(data_ai()).get_trend("curry")

    [video] = [e for e in result.value.evidence if e.source == "youtube"]
    assert video.url is None
    assert video.title == "Singapore Noodles The Takeaway Classic"


async def test_series_skips_weeks_without_value() -> None:
    detail = fixture("trend_curry.json")
    detail["series"]["google_trends_world_weekly"][0]["value"] = None

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v1/trends/curry":
            return httpx.Response(200, json=detail)
        return data_ai()(request)

    result = await source(handler).get_trend("curry")

    assert len(result.value.series) == 103
    assert result.value.series[0].period == date(2024, 11, 17)


async def test_health_and_model_metrics() -> None:
    status = await source(data_ai()).data_status()
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


SIMULATION = SimulationInput(
    growth_13w=0.45,
    growth_52w=None,
    volatility_26w=0.25,
    spike_ratio=1.4,
    acceleration=1.1,
    popularity_vs_anchor=0.2,
    market_products_log=3.0,
)


async def test_simulate_posts_data_ai_fields_and_reads_result() -> None:
    seen: list[httpx.Request] = []

    result = await DataTeamSimulator(http(data_ai(seen=seen))).simulate(SIMULATION)

    [request] = seen
    assert request.method == "POST"
    body = json.loads(request.content)
    assert body["croissance_13s"] == 0.45
    assert body["croissance_52s"] is None
    assert body["produits_marche"] == 3.0
    assert (result.probability, result.verdict) == (0.634, "durable")
    assert result.note


async def test_simulate_outage_is_unavailable() -> None:
    simulator = DataTeamSimulator(http(data_ai("/api/v1/simulate")))

    with pytest.raises(DataSourceUnavailableError):
        await simulator.simulate(SIMULATION)
