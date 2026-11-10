from app.schemas.health import HealthRead
from app.services.ports import DatabaseProbe


class HealthService:
    """Sain = API démarrée ET base joignable."""

    def __init__(self, probe: DatabaseProbe) -> None:
        self._probe = probe

    async def check(self) -> HealthRead:
        return HealthRead(db=await self._probe.server_version())
