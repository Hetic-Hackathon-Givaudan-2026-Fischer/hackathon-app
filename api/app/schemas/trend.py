"""Notre contrat du dashboard : il ne recopie pas les champs de l'API Data/IA."""

from datetime import date
from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, Field

from app.core.indicators import GROWTH_INDICATOR
from app.schemas.sourced import SourcedRead, sourced
from app.services.ports import Sourced, TrendRecord
from app.services.trends import (
    SORT_FIELDS,
    DashboardSummary,
    FamilyStat,
    TrendPage,
    TrendQuery,
)

# Literal construit depuis la liste du service : une seule source
TrendSortField = Literal[SORT_FIELDS]  # type: ignore[valid-type]


class TrendListQuery(BaseModel):
    """Filtres, tri et pagination de GET /trends."""

    family: str | None = Field(default=None, max_length=100)
    status: str | None = Field(
        default=None, max_length=100, description="Libellé exact du statut"
    )
    search: str | None = Field(default=None, max_length=100)
    sort: TrendSortField = GROWTH_INDICATOR  # type: ignore[valid-type]
    order: Literal["asc", "desc"] = "desc"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

    def to_query(self) -> TrendQuery:
        return TrendQuery(
            family=self.family,
            status=self.status,
            search=self.search,
            sort=self.sort,
            descending=self.order == "desc",
            page=self.page,
            page_size=self.page_size,
        )


class TrendRead(BaseModel):
    """Un arôme. `status` et `score` sont null en repli CSV (aucun modèle)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    family: str
    status: str | None = Field(description="Libellé du statut calculé par Data/IA")
    score: float | None = Field(
        description="Score de pérennité du modèle V2, de 0 à 100 (souvent null)"
    )
    v1_verdict: str | None = Field(description="Verdict de la règle V1 (`buzz`…)")
    confidence: str | None = Field(description="Niveau de confiance Data/IA")
    aisle: str | None = Field(description="Rayon du magasin 3D")
    indicators: dict[str, float | None] = Field(
        description="Indicateurs bruts, clés de GET /report (`indicators`)"
    )


class SeriesPointRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    period: date
    value: float


class EvidenceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    source: str
    published: date | None
    title: str
    url: str


class TrendListRead(SourcedRead):
    items: list[TrendRead]
    total: int
    page: int
    page_size: int

    @classmethod
    def build(cls, result: Sourced[TrendPage]) -> Self:
        page = result.value
        return cls(
            **sourced(result.status),
            items=[TrendRead.model_validate(item) for item in page.items],
            total=page.total,
            page=page.page,
            page_size=page.page_size,
        )


class TrendDetailRead(SourcedRead, TrendRead):
    """Fiche complète ; série, preuves et points de vigilance : Data/IA seulement."""

    series: list[SeriesPointRead] = Field(
        description="Recherches Google mondiales, par semaine"
    )
    evidence: list[EvidenceRead] = Field(description="Sources citées (presse…)")
    watch_points: list[str] = Field(description="Points de vigilance")

    @classmethod
    def build(cls, result: Sourced[TrendRecord]) -> Self:
        trend = result.value
        return cls(
            **sourced(result.status),
            **TrendRead.model_validate(trend).model_dump(),
            series=[SeriesPointRead.model_validate(p) for p in trend.series],
            evidence=[EvidenceRead.model_validate(e) for e in trend.evidence],
            watch_points=list(trend.watch_points),
        )


class FamilyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    family: str
    trend_count: int
    average_growth: float | None = Field(
        description=f"Moyenne de `{GROWTH_INDICATOR}` sur la famille"
    )


class FamilyListRead(SourcedRead):
    items: list[FamilyRead]

    @classmethod
    def build(cls, result: Sourced[list[FamilyStat]]) -> Self:
        items = [FamilyRead.model_validate(stat) for stat in result.value]
        return cls(**sourced(result.status), items=items)


class DashboardSummaryRead(SourcedRead):
    """KPI du dashboard, calculés par l'API quelle que soit l'origine."""

    trend_count: int
    family_count: int
    scored_count: int = Field(description="Arômes avec un statut (0 en repli CSV)")
    status_counts: dict[str, int]
    totals: dict[str, float]
    top_growing: list[TrendRead]

    @classmethod
    def build(cls, result: Sourced[DashboardSummary]) -> Self:
        summary = result.value
        return cls(
            **sourced(result.status),
            trend_count=summary.trend_count,
            family_count=summary.family_count,
            scored_count=summary.scored_count,
            status_counts=summary.status_counts,
            totals=summary.totals,
            top_growing=[TrendRead.model_validate(t) for t in summary.top_growing],
        )
