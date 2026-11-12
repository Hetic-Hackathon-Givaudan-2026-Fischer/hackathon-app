import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from tests.integration.conftest import SCHEMA_FILES


def test_every_schema_file_is_played_but_not_the_seed() -> None:
    names = [path.name for path in SCHEMA_FILES]

    assert {"003-report-issues.sql", "004-showroom.sql"} <= set(names)
    assert not any("seed" in name for name in names)


@pytest.mark.parametrize("table", ["data_issues", "showroom_links"])
async def test_table_exists(session: AsyncSession, table: str) -> None:
    query = text("SELECT to_regclass(:name)")

    assert await session.scalar(query, {"name": f"public.{table}"}) is not None
