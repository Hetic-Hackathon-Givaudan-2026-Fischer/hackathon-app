"""Injection de dépendances : le seul endroit qui choisit les implémentations.

Les services ne connaissent que des Protocols ; les tests remplacent ces
fonctions par des faux via `app.dependency_overrides`.
"""

from collections.abc import AsyncIterator
from typing import Annotated

import httpx
from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.ai import DataTeamProvider, OpenAICompatibleProvider
from app.core.config import Settings, get_settings
from app.repositories.database import SqlDatabaseProbe
from app.repositories.questions import SqlQuestionRepository
from app.services.health import HealthService
from app.services.ports import AnswerProvider, DatabaseProbe, QuestionRepository
from app.services.questions import QuestionService

SettingsDep = Annotated[Settings, Depends(get_settings)]


async def get_session(request: Request) -> AsyncIterator[AsyncSession]:
    """Une session par requête, rendue au pool à la fin de la réponse."""
    async with request.app.state.session_factory() as session:
        yield session


def get_http_client(request: Request) -> httpx.AsyncClient:
    """Le client HTTP partagé, créé au démarrage (voir app/main.py)."""
    return request.app.state.http


SessionDep = Annotated[AsyncSession, Depends(get_session)]
HttpClientDep = Annotated[httpx.AsyncClient, Depends(get_http_client)]


def get_answer_provider(settings: SettingsDep, http: HttpClientDep) -> AnswerProvider:
    """Mode 2 (équipe Data/IA) dès que DATA_AI_URL est renseignée, sinon mode 1."""
    if settings.data_ai_url:
        return DataTeamProvider(http, settings.data_ai_url, settings.data_ai_key)
    return OpenAICompatibleProvider(
        http, settings.ai_base_url, settings.ai_model, settings.ai_api_key
    )


def get_question_repository(session: SessionDep) -> QuestionRepository:
    return SqlQuestionRepository(session)


def get_database_probe(session: SessionDep) -> DatabaseProbe:
    return SqlDatabaseProbe(session)


def get_question_service(
    repository: Annotated[QuestionRepository, Depends(get_question_repository)],
    provider: Annotated[AnswerProvider, Depends(get_answer_provider)],
) -> QuestionService:
    return QuestionService(repository, provider)


def get_health_service(
    probe: Annotated[DatabaseProbe, Depends(get_database_probe)],
) -> HealthService:
    return HealthService(probe)


QuestionServiceDep = Annotated[QuestionService, Depends(get_question_service)]
HealthServiceDep = Annotated[HealthService, Depends(get_health_service)]
