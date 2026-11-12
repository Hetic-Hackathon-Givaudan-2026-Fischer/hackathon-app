"""Traduction des erreurs métier en réponses HTTP."""

import logging

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.core.errors import (
    DatabaseUnavailableError,
    DataSourceUnavailableError,
    GoneError,
    NotFoundError,
)
from app.schemas.error import ErrorRead

logger = logging.getLogger(__name__)


def _error(status_code: int, detail: str) -> JSONResponse:
    return JSONResponse(ErrorRead(detail=detail).model_dump(), status_code=status_code)


def internal_error_response() -> JSONResponse:
    """500 générique : jamais de détail technique dans la réponse."""
    return _error(status.HTTP_500_INTERNAL_SERVER_ERROR, "Erreur interne")


async def _database_unavailable(_: Request, exc: Exception) -> JSONResponse:
    # 503 : le healthcheck Docker passe l'API en « unhealthy ». Le détail
    # (hôte, utilisateur…) reste dans les logs, pas dans la réponse
    logger.warning("Base injoignable : %r", exc)
    return _error(status.HTTP_503_SERVICE_UNAVAILABLE, "Base injoignable")


async def _data_source_unavailable(_: Request, exc: Exception) -> JSONResponse:
    # Ne devrait pas arriver : le CSV de repli prend le relais de Data/IA
    logger.warning("Source de données indisponible : %s", exc)
    return _error(status.HTTP_503_SERVICE_UNAVAILABLE, "Source de données indisponible")


async def _not_found(_: Request, exc: Exception) -> JSONResponse:
    return _error(status.HTTP_404_NOT_FOUND, str(exc))


async def _gone(_: Request, exc: Exception) -> JSONResponse:
    return _error(status.HTTP_410_GONE, str(exc))


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(DatabaseUnavailableError, _database_unavailable)
    app.add_exception_handler(DataSourceUnavailableError, _data_source_unavailable)
    app.add_exception_handler(NotFoundError, _not_found)
    app.add_exception_handler(GoneError, _gone)
