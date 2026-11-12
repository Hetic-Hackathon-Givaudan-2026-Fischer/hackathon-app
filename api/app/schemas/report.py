"""Notre contrat du rapport d'analyse : provenance, traitements, qualité, modèle."""

from collections.abc import Mapping
from datetime import date, datetime
from typing import Annotated, Self

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints

from app.core.indicators import SOURCE_LABELS, IndicatorSource, Source
from app.schemas.sourced import SourcedRead
from app.schemas.trend import TrendRead
from app.services.ports import IssueStatus, ModelScore, Origin, QualityStatus
from app.services.traceability import DatasetReport, ModelReport, TrendReport

ISSUE_MESSAGE_MAX_LENGTH = 2000
IssueMessage = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True, min_length=1, max_length=ISSUE_MESSAGE_MAX_LENGTH
    ),
]


class DataProvenanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    origin: Origin
    data_date: date | None = Field(description="Date des données")
    fetched_at: datetime = Field(description="Date de récupération par notre API")
    api_version: str | None = Field(description="Version de l'API Data/IA")
    model_applied: bool = Field(description="false en repli CSV : indicateurs bruts")


class IndicatorSourceRead(BaseModel):
    key: str
    label: str
    source: Source
    source_label: str
    period: str
    value: float | None = Field(
        default=None, description="Valeur pour l'arôme (rapport par arôme seulement)"
    )

    @classmethod
    def build(
        cls, indicator: IndicatorSource, values: Mapping[str, float | None] | None
    ) -> Self:
        return cls(
            key=indicator.key,
            label=indicator.label,
            source=indicator.source,
            source_label=SOURCE_LABELS[indicator.source],
            period=indicator.period,
            value=values.get(indicator.key) if values else None,
        )


class ProcessingStepRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order: int
    name: str
    version: str | None
    description: str


class QualityMetricRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    key: str
    label: str
    value: float = Field(description="Part de 0 à 1")
    threshold: float = Field(description="Seuil d'alerte (warning au-delà)")
    status: QualityStatus


class DatasetReportRead(SourcedRead):
    """Provenance et qualité de tout le jeu de données."""

    status: QualityStatus = Field(description="Statut global, calculé")
    trend_count: int
    provenance: DataProvenanceRead
    indicators: list[IndicatorSourceRead]
    steps: list[ProcessingStepRead]
    quality: list[QualityMetricRead]

    @classmethod
    def build(cls, report: DatasetReport) -> Self:
        p = report.provenance
        return cls(
            origin=p.origin,
            data_date=p.data_date,
            status=report.status,
            trend_count=report.trend_count,
            provenance=DataProvenanceRead.model_validate(p),
            indicators=[IndicatorSourceRead.build(i, None) for i in report.indicators],
            steps=[ProcessingStepRead.model_validate(s) for s in report.steps],
            quality=[QualityMetricRead.model_validate(q) for q in report.quality],
        )


class TrendReportRead(SourcedRead):
    """Provenance et qualité d'un arôme, indicateur par indicateur."""

    status: QualityStatus
    provenance: DataProvenanceRead
    trend: TrendRead
    indicators: list[IndicatorSourceRead]
    quality: list[QualityMetricRead]

    @classmethod
    def build(cls, report: TrendReport) -> Self:
        p, values = report.provenance, report.trend.indicators
        return cls(
            origin=p.origin,
            data_date=p.data_date,
            status=report.status,
            provenance=DataProvenanceRead.model_validate(p),
            trend=TrendRead.model_validate(report.trend),
            indicators=[
                IndicatorSourceRead.build(i, values) for i in report.indicators
            ],
            quality=[QualityMetricRead.model_validate(q) for q in report.quality],
        )


class ConfusionMatrixRead(BaseModel):
    """Cas réels (pérenne / buzz) croisés avec la prédiction du modèle."""

    model_config = ConfigDict(from_attributes=True)

    perennial_predicted_perennial: int
    perennial_predicted_buzz: int
    buzz_predicted_perennial: int
    buzz_predicted_buzz: int


class ModelScoreRead(BaseModel):
    """Le modèle V2 ou une référence (V1, « toujours pérenne »)."""

    model_config = ConfigDict(from_attributes=True)

    version: str
    description: str | None
    accuracy: float | None
    balanced_accuracy: float | None = Field(description="Métrique à lire en premier")
    buzz_detected: float | None = Field(description="Part des vrais buzz repérés")
    f1: float | None = Field(description="F1 de la classe pérenne (modèle seulement)")
    roc_auc: float | None
    confusion: ConfusionMatrixRead | None


class ModelReportRead(BaseModel):
    """Validation du modèle V2 et de ses références ; `available: false` en repli."""

    available: bool
    reason: str | None = Field(description="Pourquoi les métriques manquent")
    validation: str | None = Field(description="Méthode de validation du modèle")
    label_rule: str | None = Field(description="Définition d'un buzz / d'un pérenne")
    interpretation: str | None = Field(description="Comment lire ces métriques")
    case_count: int | None = Field(description="Nombre de cas de validation")
    features: list[str] = Field(description="Variables du modèle")
    models: list[ModelScoreRead]

    @classmethod
    def build(cls, report: ModelReport) -> Self:
        m = report.metrics
        models: tuple[ModelScore, ...] = m.models if m else ()
        return cls(
            available=report.available,
            reason=report.reason,
            validation=m.validation if m else None,
            label_rule=m.label_rule if m else None,
            interpretation=m.interpretation if m else None,
            case_count=m.case_count if m else None,
            features=list(m.features) if m else [],
            models=[ModelScoreRead.model_validate(score) for score in models],
        )


class DataIssueCreate(BaseModel):
    """Corps de POST /report/issues."""

    trend_id: str | None = Field(
        default=None,
        max_length=100,
        description="Arôme concerné ; absent : le rapport global",
    )
    message: IssueMessage = Field(examples=["Les vues Wikipédia de l'açaï sont à 0."])
    contact: EmailStr | None = Field(default=None, description="Pour vous recontacter")


class DataIssueRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    trend_id: str | None
    message: str
    contact: str | None
    request_id: str = Field(description="À communiquer au support")
    data_origin: Origin = Field(description="Origine des données au signalement")
    status: IssueStatus
    created_at: datetime
