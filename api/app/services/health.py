import logging

from app.core.errors import DataSourceUnavailableError
from app.schemas.health import DataAiState, HealthRead
from app.services.ports import DatabaseProbe, DataStatusSource

logger = logging.getLogger(__name__)


class HealthService:
    """Sain = API démarrée ET base joignable.

    L'état de l'API Data/IA est rapporté sans compter : le CSV prend le relais.
    `data_ai` None : DATA_AI_URL vide.
    """

    def __init__(
        self, probe: DatabaseProbe, data_ai: DataStatusSource | None = None
    ) -> None:
        self._probe = probe
        self._data_ai = data_ai

    async def check(self) -> HealthRead:
        version = await self._probe.server_version()
        return HealthRead(db=version, data_ai=await self._data_ai_state())

    async def _data_ai_state(self) -> DataAiState:
        if self._data_ai is None:
            return "non_configuree"
        try:
            await self._data_ai.data_status()
        except DataSourceUnavailableError as exc:
            logger.warning("API Data/IA injoignable : %s", exc)
            return "down"
        return "up"
