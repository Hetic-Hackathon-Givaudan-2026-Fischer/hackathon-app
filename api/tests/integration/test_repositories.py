from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.database import SqlDatabaseProbe
from app.repositories.questions import SqlQuestionRepository
from app.services.questions import LATEST_LIMIT


async def test_add_reads_back_generated_columns(session: AsyncSession) -> None:
    created = await SqlQuestionRepository(session).add("Bonjour ?", "Salut.")

    assert created.id > 0
    assert isinstance(created.created_at, datetime)
    assert created.created_at.tzinfo is not None
    assert (created.question, created.answer) == ("Bonjour ?", "Salut.")


async def test_list_latest_is_most_recent_first_and_limited(
    session: AsyncSession,
) -> None:
    repository = SqlQuestionRepository(session)
    added = [await repository.add(f"Q{i}", "R") for i in range(LATEST_LIMIT + 2)]

    latest = await repository.list_latest(LATEST_LIMIT)

    expected = [row.id for row in reversed(added)][:LATEST_LIMIT]
    assert [row.id for row in latest] == expected


async def test_probe_returns_server_version(session: AsyncSession) -> None:
    assert "PostgreSQL" in await SqlDatabaseProbe(session).server_version()
