"""Bascule entre deux sources de tendances, et métriques sans modèle joignable."""

import logging
from collections.abc import Awaitable, Callable

from app.core.errors import DataSourceUnavailableError
from app.services.ports import (
    DataStatus,
    ModelMetrics,
    Sourced,
    TrendRecord,
    TrendSource,
)

logger = logging.getLogger(__name__)


class FallbackTrendSource:
    """TrendSource : `primary` d'abord, `fallback` si elle est injoignable.

    Un NotFoundError de `primary` remonte tel quel : un arôme inconnu de l'API
    Data/IA n'est pas une panne.
    """

    def __init__(self, primary: TrendSource, fallback: TrendSource) -> None:
        self._primary = primary
        self._fallback = fallback

    async def data_status(self) -> DataStatus:
        return await self._call(lambda source: source.data_status())

    async def list_trends(self) -> Sourced[list[TrendRecord]]:
        return await self._call(lambda source: source.list_trends())

    async def get_trend(self, trend_id: str) -> Sourced[TrendRecord]:
        return await self._call(lambda source: source.get_trend(trend_id))

    async def _call[T](self, call: Callable[[TrendSource], Awaitable[T]]) -> T:
        try:
            return await call(self._primary)
        except DataSourceUnavailableError as exc:
            logger.warning("API Data/IA indisponible, bascule sur le CSV : %s", exc)
            return await call(self._fallback)


class UnavailableModelMetrics:
    """ModelMetricsSource quand aucun modèle n'est joignable (DATA_AI_URL vide)."""

    def __init__(self, reason: str = "API Data/IA non configurée") -> None:
        self._reason = reason

    async def model_metrics(self) -> ModelMetrics:
        raise DataSourceUnavailableError(self._reason)
