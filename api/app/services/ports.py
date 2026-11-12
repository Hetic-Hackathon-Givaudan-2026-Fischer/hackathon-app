"""Ports des services : ce dont la logique métier a besoin, sans dire comment.

Les implémentations (SQLAlchemy, httpx, CSV) vivent dans app/repositories et
app/clients ; seul app/api/deps.py les relie à ces Protocols.
"""

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import date, datetime
from typing import Literal, Protocol

# --- Santé -----------------------------------------------------------------------


class DatabaseProbe(Protocol):
    """Sonde de la base, pour le healthcheck."""

    async def server_version(self) -> str: ...


# --- Tendances (indépendantes du format Data/IA comme du CSV) -------------------

Origin = Literal["data_ai", "csv_fallback"]


@dataclass(frozen=True, slots=True)
class DataStatus:
    """D'où viennent les données servies, et de quand elles datent."""

    origin: Origin
    data_date: date | None
    fetched_at: datetime
    api_version: str | None = None


@dataclass(frozen=True, slots=True)
class SeriesPoint:
    """Un point de la série temporelle d'un arôme."""

    period: date
    value: float


@dataclass(frozen=True, slots=True)
class Evidence:
    """Une source citée à l'appui d'une tendance (article, vidéo…)."""

    source: str
    published: date | None
    title: str | None
    url: str | None


ProductBasis = Literal["produits", "famille"]
AnalysisStatus = Literal[
    "exploding",
    "emerging",
    "growing",
    "seasonal",
    "stable",
    "declining",
    "insufficient_data",
]
AnalysisConfidence = Literal["high", "medium", "low"]


@dataclass(frozen=True, slots=True)
class ProductShare:
    """Un type de produit (rayon) où l'arôme est présent.

    `basis` « famille » : aucun produit trouvé, type déduit de la famille ;
    `share` est alors None.
    """

    id: str
    label: str
    products: int
    share: float | None
    basis: ProductBasis


@dataclass(frozen=True, slots=True)
class TrendAnalysis:
    """Indicateurs métier calculés par Data/IA (sans LLM).

    `buzz_score` / `trend_score` : rangs relatifs de 0 à 100 (bêta).
    """

    status: AnalysisStatus
    reason: str
    buzz_score: int | None
    trend_score: int | None
    confidence: AnalysisConfidence


@dataclass(frozen=True, slots=True)
class TrendRecord:
    """Un arôme : identité, indicateurs bruts et, si un modèle tourne, son verdict.

    `indicators` : clés de app/core/indicators.py. Clé absente = indicateur non
    fourni par la source ; None = fourni mais vide.
    """

    id: str
    name: str
    family: str
    indicators: Mapping[str, float | None]
    status: str | None = None
    score: float | None = None
    v1_verdict: str | None = None
    confidence: str | None = None
    aisle: str | None = None
    series: tuple[SeriesPoint, ...] = ()
    evidence: tuple[Evidence, ...] = ()
    watch_points: tuple[str, ...] = ()
    name_en: str | None = None
    main_product_type: str | None = None
    product_types: tuple[ProductShare, ...] = ()
    analysis: TrendAnalysis | None = None


@dataclass(frozen=True, slots=True)
class Sourced[T]:
    """Une donnée et sa provenance : chaque réponse dit d'où elle vient."""

    value: T
    status: DataStatus


@dataclass(frozen=True, slots=True)
class ConfusionMatrix:
    """Cas réels (pérenne / buzz) croisés avec la prédiction du modèle."""

    perennial_predicted_perennial: int
    perennial_predicted_buzz: int
    buzz_predicted_perennial: int
    buzz_predicted_buzz: int


@dataclass(frozen=True, slots=True)
class ModelScore:
    """Validation d'une version du modèle (V2 régression) ou d'une référence (V1…).

    `buzz_detected` : part des vrais buzz repérés (rappel de la classe buzz).
    `f1` : F1 de la classe pérenne.
    """

    version: str
    description: str | None
    accuracy: float | None
    balanced_accuracy: float | None
    buzz_detected: float | None
    f1: float | None = None
    roc_auc: float | None = None
    confusion: ConfusionMatrix | None = None


@dataclass(frozen=True, slots=True)
class ModelMetrics:
    models: tuple[ModelScore, ...]
    validation: str | None
    label_rule: str | None = None
    interpretation: str | None = None
    case_count: int | None = None
    features: tuple[str, ...] = ()


class DataStatusSource(Protocol):
    """Disponibilité et date des données d'une source."""

    async def data_status(self) -> DataStatus: ...


class TrendSource(DataStatusSource, Protocol):
    """Tendances d'arômes. `get_trend` lève NotFoundError si l'arôme est inconnu."""

    async def list_trends(self) -> Sourced[list[TrendRecord]]: ...

    async def get_trend(self, trend_id: str) -> Sourced[TrendRecord]: ...


class ModelMetricsSource(Protocol):
    """Métriques du modèle ; lève DataSourceUnavailableError sans modèle joignable."""

    async def model_metrics(self) -> ModelMetrics: ...


# --- Simulation de pérennité ----------------------------------------------------

SimulationVerdict = Literal["durable", "buzz probable", "incertain"]


@dataclass(frozen=True, slots=True)
class SimulationInput:
    """Variables d'un arôme en hausse, saisies à la main (calculatrice « et si »)."""

    growth_13w: float
    growth_52w: float | None
    volatility_26w: float | None
    spike_ratio: float | None
    acceleration: float | None
    popularity_vs_anchor: float | None
    market_products_log: float | None


@dataclass(frozen=True, slots=True)
class SimulationResult:
    """Probabilité (0-1) que la hausse dure un an, selon le modèle V2."""

    probability: float
    verdict: SimulationVerdict
    note: str


class PerennitySimulator(Protocol):
    """Modèle V2 ; lève DataSourceUnavailableError sans modèle joignable."""

    async def simulate(self, inputs: SimulationInput) -> SimulationResult: ...


# --- Traçabilité ------------------------------------------------------------------

QualityStatus = Literal["ok", "warning", "error"]


@dataclass(frozen=True, slots=True)
class DataProvenance:
    """D'où viennent les données, quand, et si un modèle leur a été appliqué."""

    origin: Origin
    data_date: date | None
    fetched_at: datetime
    api_version: str | None
    model_applied: bool


@dataclass(frozen=True, slots=True)
class ProcessingStep:
    order: int
    name: str
    version: str | None
    description: str


@dataclass(frozen=True, slots=True)
class QualityMetric:
    """Une mesure de qualité calculée sur les données reçues."""

    key: str
    label: str
    value: float
    threshold: float
    status: QualityStatus


# --- Signalements -----------------------------------------------------------------

IssueStatus = Literal["open", "in_progress", "resolved"]


@dataclass(frozen=True, slots=True)
class NewDataIssue:
    """Un signalement à enregistrer. `trend_id` None : le rapport global."""

    trend_id: str | None
    message: str
    contact: str | None
    request_id: str
    data_origin: Origin


@dataclass(frozen=True, slots=True)
class DataIssueRecord:
    id: int
    trend_id: str | None
    message: str
    contact: str | None
    request_id: str
    data_origin: Origin
    status: IssueStatus
    created_at: datetime


class DataIssueRepository(Protocol):
    """Stockage des signalements."""

    async def add(self, issue: NewDataIssue) -> DataIssueRecord: ...


# --- Liens showroom ---------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class NewShowroomLink:
    token_hash: str
    client_label: str
    families: tuple[str, ...]
    expires_at: datetime


@dataclass(frozen=True, slots=True)
class ShowroomLinkRecord:
    """Un lien showroom. `families` vide : toutes les familles."""

    id: int
    client_label: str
    families: tuple[str, ...]
    expires_at: datetime
    revoked_at: datetime | None
    created_at: datetime


class ShowroomLinkRepository(Protocol):
    """Stockage des liens showroom ; seul le hash du jeton est connu."""

    async def add(self, link: NewShowroomLink) -> ShowroomLinkRecord: ...

    async def list_all(self) -> list[ShowroomLinkRecord]: ...

    async def get(self, link_id: int) -> ShowroomLinkRecord | None: ...

    async def find_by_hash(self, token_hash: str) -> ShowroomLinkRecord | None: ...

    async def revoke(self, link_id: int, at: datetime) -> ShowroomLinkRecord | None: ...


class TokenGenerator(Protocol):
    """Jetons opaques à haute entropie."""

    def new_token(self) -> str: ...
