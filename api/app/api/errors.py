"""Traduction des erreurs métier en réponses HTTP."""

import logging

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.core.errors import AIProviderError, DatabaseUnavailableError
from app.schemas.error import ErrorRead

logger = logging.getLogger(__name__)


def _error(status_code: int, detail: str) -> JSONResponse:
    return JSONResponse(ErrorRead(detail=detail).model_dump(), status_code=status_code)


async def _ai_provider_error(_: Request, exc: Exception) -> JSONResponse:
    # 502 : l'API va bien, c'est l'IA en amont qui a échoué
    return _error(status.HTTP_502_BAD_GATEWAY, str(exc))


async def _database_unavailable(_: Request, exc: Exception) -> JSONResponse:
    # 503 : le healthcheck Docker passe l'API en « unhealthy ». Le détail
    # (hôte, utilisateur…) reste dans les logs, pas dans la réponse
    logger.warning("Base injoignable : %r", exc)
    return _error(status.HTTP_503_SERVICE_UNAVAILABLE, "Base injoignable")


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AIProviderError, _ai_provider_error)
    app.add_exception_handler(DatabaseUnavailableError, _database_unavailable)
