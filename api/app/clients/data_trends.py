"""API Data/IA « FlavorTrends » : seul fichier qui connaît le format de ses réponses.

Le format suit le Swagger Data/IA (docs/data/swagger-data/openapi.json, v1.2.0)
et de vraies réponses, enregistrées dans tests/fixtures/data_ai/*.json. Si l'équipe
Data/IA change un champ, on ne modifie que ce fichier et ces fixtures.

Toute réponse qui ne colle pas au format (clé absente, mauvais type) lève
DataSourceUnavailableError, comme un JSON illisible : le CSV prend le relais.
"""

import asyncio
import logging
from collections.abc import Callable
from datetime import UTC, date, datetime
from typing import Any, get_args
from urllib.parse import quote

from app.clients.data_ai_http import DataAiHttp
from app.core.errors import DataSourceUnavailableError
from app.services.ports import (
    AnalysisConfidence,
    AnalysisStatus,
    ConfusionMatrix,
    DataStatus,
    Evidence,
    ModelMetrics,
    ModelScore,
    ProductBasis,
    ProductShare,
    SeriesPoint,
    SimulationInput,
    SimulationResult,
    SimulationVerdict,
    Sourced,
    TrendAnalysis,
    TrendRecord,
)

logger = logging.getLogger(__name__)

# Le healthcheck Docker abandonne au bout de 2 s : la sonde Data/IA doit tenir en 1 s
HEALTH_TIMEOUT = 1.0
# Erreurs levées par un format inattendu pendant la lecture
_FORMAT_ERRORS = (KeyError, IndexError, TypeError, ValueError, AttributeError)
# Champ `metrics` de Data/IA → clé de app/core/indicators.py. Les champs non
# numériques (efsa_regulatory_status) ne sont pas des indicateurs
METRIC_KEYS = {
    "search_growth_13w_pct": "recherche_croissance_13s_pct",
    "search_growth_52w_pct": "recherche_croissance_52s_pct",
    "search_volatility_26w": "recherche_volatilite_26s",
    "search_spike_ratio": "recherche_pic_ratio",
    "popularity_vs_vanilla": "popularite_vs_vanille",
    "wikipedia_growth_12m_relative_pts": "wiki_croissance_12m_relative",
    "openfoodfacts_products_count": "produits_total",
    "openfoodfacts_brands": "marques_distinctes",
    "openfoodfacts_countries": "pays_distincts",
    "press_mentions_30d": "mentions_presse_30j",
    "social_mentions_30d": "mentions_reseaux_30j",
    "youtube_views_30d": "youtube_vues_30j",
    "sponsored_share_30d": "part_sponsorise_30j",
}
# Série affichée dans la fiche : recherches Google mondiales, par semaine
SERIES_KEY = "google_trends_world_weekly"
# Références comparées au modèle : `baselines` Data/IA → (version, clé de description)
BASELINES = {
    "v1_regle_gros_pic": ("V1", "v1_description"),
    "reference_toujours_perenne": ("Référence « toujours pérenne »", None),
}

# Indicateurs métier de `GET /ai/indicators`, par identifiant d'arôme
type Analyses = dict[str, TrendAnalysis]


def _parse[T](reader: Callable[[Any], T], payload: Any) -> T:
    try:
        return reader(payload)
    except _FORMAT_ERRORS as exc:
        raise DataSourceUnavailableError(f"format inattendu ({exc!r})") from exc


def _optional_float(value: Any) -> float | None:
    return None if value is None else float(value)


def _member(value: Any, allowed: Any) -> Any:
    """Valeur d'un `Literal` ; inconnue → ValueError (format inattendu, pas une 500)."""
    if value not in get_args(allowed):
        raise ValueError(f"valeur inattendue : {value!r}")
    return value


def _optional_str(value: Any) -> str | None:
    return None if value is None else str(value)


def _optional_int(value: Any) -> int | None:
    return None if value is None else int(value)


def _optional_date(value: Any) -> date | None:
    return date.fromisoformat(str(value)[:10]) if value else None


def _status(payload: dict[str, Any]) -> DataStatus:
    """`generated_at` (ISO) : date de calcul des données par Data/IA."""
    return DataStatus(
        origin="data_ai",
        data_date=_optional_date(payload["generated_at"]),
        fetched_at=datetime.now(UTC),
    )


def _indicators(metrics: dict[str, Any]) -> dict[str, float | None]:
    return {
        key: _optional_float(metrics.get(name)) for name, key in METRIC_KEYS.items()
    }


def _series(series: dict[str, Any] | None) -> tuple[SeriesPoint, ...]:
    """`{"google_trends_world_weekly": [{"week": "2024-11-10", "value": 20.0}]}`.

    Une semaine sans valeur (`null`) n'est pas un zéro : elle est omise.
    """
    points = (series or {}).get(SERIES_KEY) or ()
    return tuple(
        SeriesPoint(period=date.fromisoformat(p["week"]), value=float(p["value"]))
        for p in points
        if p.get("value") is not None
    )


def _evidence(items: list[dict[str, Any]] | None) -> tuple[Evidence, ...]:
    return tuple(
        Evidence(
            source=str(item["source"]),
            published=_optional_date(item.get("date")),
            title=_optional_str(item.get("title")),
            url=_optional_str(item.get("url")),
        )
        for item in items or ()
    )


def _product_types(items: list[dict[str, Any]] | None) -> tuple[ProductShare, ...]:
    """`[{"id": "plats", "label": "…", "products": 79, "share": 0.43, "basis": …}]`."""
    return tuple(
        ProductShare(
            id=str(item["id"]),
            label=str(item["label"]),
            products=int(item["products"]),
            share=_optional_float(item.get("share")),
            basis=_member(item["basis"], ProductBasis),
        )
        for item in items or ()
    )


def _analysis(item: dict[str, Any]) -> TrendAnalysis:
    """Un élément de `GET /ai/indicators`."""
    return TrendAnalysis(
        status=_member(item["trend_status"], AnalysisStatus),
        reason=str(item["trend_status_reason"]),
        buzz_score=_optional_int(item.get("buzz_score")),
        trend_score=_optional_int(item.get("trend_score")),
        confidence=_member(item["confidence_level"], AnalysisConfidence),
    )


def read_analyses(payload: list[dict[str, Any]]) -> Analyses:
    """`GET /ai/indicators` : les indicateurs métier, par identifiant d'arôme."""
    return {str(item["trend_id"]): _analysis(item) for item in payload}


def _trend(item: dict[str, Any], analyses: Analyses | None = None) -> TrendRecord:
    scores = item.get("scores") or {}
    trend_id = str(item["trend_id"])
    return TrendRecord(
        id=trend_id,
        name=str(item["aroma_name"]),
        name_en=_optional_str(item.get("aroma_name_en")),
        family=str(item["family"]),
        indicators=_indicators(item["metrics"]),
        status=item.get("status_label"),
        score=_optional_float(scores.get("v2_perennity_score")),
        v1_verdict=scores.get("v1_rule_verdict"),
        confidence=scores.get("confidence_level"),
        aisle=item.get("category_3d_aisle"),
        series=_series(item.get("series")),
        evidence=_evidence(item.get("evidence")),
        watch_points=tuple(str(point) for point in item.get("watch_points") or ()),
        main_product_type=_optional_str(item.get("main_product_type")),
        product_types=_product_types(item.get("product_types")),
        analysis=(analyses or {}).get(trend_id),
    )


def read_trends(
    payload: dict[str, Any], analyses: Analyses | None = None
) -> Sourced[list[TrendRecord]]:
    """`{"count", "generated_at", "trends": [...]}`."""
    trends = [_trend(item, analyses) for item in payload["trends"]]
    return Sourced(trends, _status(payload))


def _confusion(matrix: dict[str, Any]) -> ConfusionMatrix:
    return ConfusionMatrix(
        perennial_predicted_perennial=int(matrix["vrai_perenne_predit_perenne"]),
        perennial_predicted_buzz=int(matrix["vrai_perenne_predit_buzz"]),
        buzz_predicted_perennial=int(matrix["vrai_buzz_predit_perenne"]),
        buzz_predicted_buzz=int(matrix["vrai_buzz_predit_buzz"]),
    )


def _main_model(payload: dict[str, Any]) -> ModelScore:
    return ModelScore(
        version=str(payload["model_version"]),
        description=payload.get("model_description"),
        accuracy=_optional_float(payload.get("accuracy")),
        balanced_accuracy=_optional_float(payload.get("balanced_accuracy")),
        buzz_detected=_optional_float(payload.get("buzz_detectes")),
        f1=_optional_float(payload.get("f1_perenne")),
        roc_auc=_optional_float(payload.get("roc_auc")),
        confusion=_confusion(payload["confusion_matrix"]),
    )


def _baseline(payload: dict[str, Any], name: str) -> ModelScore:
    version, description_key = BASELINES[name]
    scores = payload["baselines"][name]
    return ModelScore(
        version=version,
        description=payload.get(description_key) if description_key else None,
        accuracy=_optional_float(scores.get("accuracy")),
        balanced_accuracy=_optional_float(scores.get("balanced_accuracy")),
        buzz_detected=_optional_float(scores.get("buzz_detectes")),
    )


def read_model_metrics(payload: dict[str, Any]) -> ModelMetrics:
    present = [name for name in BASELINES if name in payload.get("baselines", {})]
    return ModelMetrics(
        models=(_main_model(payload), *(_baseline(payload, n) for n in present)),
        validation=payload.get("validation"),
        label_rule=payload.get("label_rule"),
        interpretation=payload.get("lecture"),
        case_count=payload.get("n_cases"),
        features=tuple(payload.get("features") or ()),
    )


# Champs de `POST /simulate` (SimulationRequest Data/IA) ← SimulationInput
SIMULATION_FIELDS = {
    "croissance_13s": "growth_13w",
    "croissance_52s": "growth_52w",
    "volatilite_26s": "volatility_26w",
    "pic_ratio": "spike_ratio",
    "acceleration": "acceleration",
    "popularite_vs_ancre": "popularity_vs_anchor",
    "produits_marche": "market_products_log",
}


def simulation_body(inputs: SimulationInput) -> dict[str, float | None]:
    return {name: getattr(inputs, field) for name, field in SIMULATION_FIELDS.items()}


def read_simulation(payload: dict[str, Any]) -> SimulationResult:
    """`{"v2_probability_perenne": 0.63, "verdict": "durable", "note": "…"}`."""
    return SimulationResult(
        probability=float(payload["v2_probability_perenne"]),
        verdict=_member(payload["verdict"], SimulationVerdict),
        note=str(payload["note"]),
    )


class DataTeamTrendSource:
    """TrendSource sur l'API Data/IA ; panne → DataSourceUnavailableError."""

    def __init__(self, client: DataAiHttp) -> None:
        self._client = client

    async def data_status(self) -> DataStatus:
        time_limit = min(self._client.timeout, HEALTH_TIMEOUT)
        payload = await self._client.get_json("/health", time_limit=time_limit)
        return _parse(_status, payload)

    async def list_trends(self) -> Sourced[list[TrendRecord]]:
        params = {"include_series": "false"}
        payload, analyses = await asyncio.gather(
            self._client.get_json("/trends", params=params), self._analyses()
        )
        return _parse(lambda body: read_trends(body, analyses), payload)

    async def get_trend(self, trend_id: str) -> Sourced[TrendRecord]:
        """La fiche n'a pas de date : on la prend dans /health, en parallèle."""
        path = f"/trends/{quote(trend_id, safe='')}"
        not_found = f"Arôme inconnu : {trend_id}"
        payload, status, analyses = await asyncio.gather(
            self._client.get_json(path, not_found=not_found),
            self.data_status(),
            self._analyses(),
        )
        return Sourced(_parse(lambda body: _trend(body, analyses), payload), status)

    async def _analyses(self) -> Analyses:
        """Indicateurs métier ; leur panne laisse `analysis` vide, sans repli CSV."""
        try:
            payload = await self._client.get_json("/ai/indicators")
            return _parse(read_analyses, payload)
        except DataSourceUnavailableError as exc:
            logger.warning("Indicateurs métier Data/IA indisponibles : %s", exc)
            return {}


class DataTeamModelMetrics:
    """ModelMetricsSource sur l'API Data/IA (modèle V2 et ses références)."""

    def __init__(self, client: DataAiHttp) -> None:
        self._client = client

    async def model_metrics(self) -> ModelMetrics:
        payload = await self._client.get_json("/model-metrics")
        return _parse(read_model_metrics, payload)


class DataTeamSimulator:
    """PerennitySimulator sur l'API Data/IA (`POST /simulate`, modèle V2)."""

    def __init__(self, client: DataAiHttp) -> None:
        self._client = client

    async def simulate(self, inputs: SimulationInput) -> SimulationResult:
        payload = await self._client.post_json("/simulate", simulation_body(inputs))
        return _parse(read_simulation, payload)
