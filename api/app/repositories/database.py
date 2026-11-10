from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.errors import db_errors


class SqlDatabaseProbe:
    """DatabaseProbe sur PostgreSQL : une vraie requête, pas un simple ping."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def server_version(self) -> str:
        with db_errors():
            version = await self._session.scalar(text("SELECT version()"))
        return str(version)
