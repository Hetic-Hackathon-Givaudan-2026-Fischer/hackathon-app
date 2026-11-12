from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.database import SqlDatabaseProbe


async def test_probe_returns_server_version(session: AsyncSession) -> None:
    assert "PostgreSQL" in await SqlDatabaseProbe(session).server_version()
