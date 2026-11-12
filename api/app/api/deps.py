"""Injection de dépendances : le seul endroit qui choisit les implémentations.

Les services ne connaissent que des Protocols ; les tests remplacent ces
fonctions par des faux via `app.dependency_overrides`.
"""

from collections.abc import AsyncIterator
from functools import lru_cache
from typing import Annotated

import httpx
from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.csv_trends import CsvTrendSource
from app.clients.data_ai_http import DataAiHttp
from app.clients.data_trends import DataTeamModelMetrics, DataTeamTrendSource
from app.clients.fallback import FallbackTrendSource, UnavailableModelMetrics
from app.clients.tokens import SecretsTokenGenerator
from app.core.config import Settings, get_settings
from app.repositories.data_issues import SqlDataIssueRepository
from app.repositories.database import SqlDatabaseProbe
from app.repositories.showroom_links import SqlShowroomLinkRepository
from app.services.health import HealthService
from app.services.issues import IssueService
from app.services.ports import (
    DatabaseProbe,
    DataIssueRepository,
    DataStatusSource,
    ModelMetricsSource,
    ShowroomLinkRepository,
    TokenGenerator,
    TrendSource,
)
from app.services.showroom import (
    ShowroomLinkService,
    ShowroomSettings,
    ShowroomViewService,
)
from app.services.traceability import TraceabilityService
from app.services.trends import TrendService

SettingsDep = Annotated[Settings, Depends(get_settings)]


async def get_session(request: Request) -> AsyncIterator[AsyncSession]:
    """Une session par requête, rendue au pool à la fin de la réponse."""
    async with request.app.state.session_factory() as session:
        yield session


def get_http_client(request: Request) -> httpx.AsyncClient:
    """Le client HTTP partagé, créé au démarrage (voir app/main.py)."""
    return request.app.state.http


def get_request_id(request: Request) -> str:
    """Posé par app/api/middleware.py, renvoyé dans l'en-tête X-Request-ID."""
    return request.state.request_id


SessionDep = Annotated[AsyncSession, Depends(get_session)]
HttpClientDep = Annotated[httpx.AsyncClient, Depends(get_http_client)]
RequestIdDep = Annotated[str, Depends(get_request_id)]


# --- Santé ----------------------------------------------------------------------


def get_database_probe(session: SessionDep) -> DatabaseProbe:
    return SqlDatabaseProbe(session)


# --- Sources de tendances (ADR 0008) ----------------------------------------------


@lru_cache
def get_csv_trend_source() -> CsvTrendSource:
    """Le CSV de repli, lu une seule fois par processus."""
    return CsvTrendSource()


def get_data_ai_http(settings: SettingsDep, request: Request) -> DataAiHttp | None:
    """None si DATA_AI_URL est vide : le CSV sert seul."""
    if not settings.data_ai_url:
        return None
    return DataAiHttp(
        get_http_client(request),
        settings.data_ai_url,
        settings.data_ai_key,
        settings.data_ai_timeout_seconds,
    )


DataAiHttpDep = Annotated[DataAiHttp | None, Depends(get_data_ai_http)]


def get_data_ai_trend_source(client: DataAiHttpDep) -> TrendSource | None:
    return DataTeamTrendSource(client) if client else None


DataAiTrendSourceDep = Annotated[TrendSource | None, Depends(get_data_ai_trend_source)]


def get_trend_source(data_ai: DataAiTrendSourceDep) -> TrendSource:
    """Data/IA d'abord, CSV en repli ; CSV seul si Data/IA n'est pas configurée."""
    csv = get_csv_trend_source()
    return FallbackTrendSource(data_ai, csv) if data_ai else csv


def get_model_metrics_source(client: DataAiHttpDep) -> ModelMetricsSource:
    return DataTeamModelMetrics(client) if client else UnavailableModelMetrics()


TrendSourceDep = Annotated[TrendSource, Depends(get_trend_source)]


def get_health_service(
    probe: Annotated[DatabaseProbe, Depends(get_database_probe)],
    data_ai: Annotated[DataStatusSource | None, Depends(get_data_ai_trend_source)],
) -> HealthService:
    return HealthService(probe, data_ai)


def get_trend_service(source: TrendSourceDep) -> TrendService:
    return TrendService(source)


def get_traceability_service(
    source: TrendSourceDep,
    metrics: Annotated[ModelMetricsSource, Depends(get_model_metrics_source)],
) -> TraceabilityService:
    return TraceabilityService(source, metrics)


# --- Signalements et showroom -----------------------------------------------------


def get_data_issue_repository(session: SessionDep) -> DataIssueRepository:
    return SqlDataIssueRepository(session)


def get_issue_service(
    repository: Annotated[DataIssueRepository, Depends(get_data_issue_repository)],
    source: TrendSourceDep,
) -> IssueService:
    return IssueService(repository, source)


def get_showroom_link_repository(session: SessionDep) -> ShowroomLinkRepository:
    return SqlShowroomLinkRepository(session)


def get_token_generator() -> TokenGenerator:
    return SecretsTokenGenerator()


def get_showroom_link_service(
    repository: Annotated[
        ShowroomLinkRepository, Depends(get_showroom_link_repository)
    ],
    tokens: Annotated[TokenGenerator, Depends(get_token_generator)],
    settings: SettingsDep,
) -> ShowroomLinkService:
    config = ShowroomSettings(
        public_web_url=settings.public_web_url,
        default_ttl_hours=settings.showroom_link_ttl_hours,
    )
    return ShowroomLinkService(repository, tokens, config)


ShowroomLinkServiceDep = Annotated[
    ShowroomLinkService, Depends(get_showroom_link_service)
]


def get_showroom_view_service(
    links: ShowroomLinkServiceDep, source: TrendSourceDep
) -> ShowroomViewService:
    return ShowroomViewService(links, source)


HealthServiceDep = Annotated[HealthService, Depends(get_health_service)]
TrendServiceDep = Annotated[TrendService, Depends(get_trend_service)]
TraceabilityServiceDep = Annotated[
    TraceabilityService, Depends(get_traceability_service)
]
IssueServiceDep = Annotated[IssueService, Depends(get_issue_service)]
ShowroomViewServiceDep = Annotated[
    ShowroomViewService, Depends(get_showroom_view_service)
]
