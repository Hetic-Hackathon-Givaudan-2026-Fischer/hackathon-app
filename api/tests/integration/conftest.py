"""Tests sur une vraie PostgreSQL : URL dans TEST_DATABASE_URL, sinon ignorés.

Chaque test tourne dans une transaction annulée à la fin : rien ne reste en
base, même sur la base de dev (le commit du repository ne fait que libérer un
SAVEPOINT de cette transaction).
"""

import os
from collections.abc import AsyncIterator
from pathlib import Path

import pytest
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncSession, create_async_engine

from app.core.config import to_async_url

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")
# Le schéma de référence, le même que celui joué par le conteneur db (sans le seed)
INIT_DIR = Path(__file__).resolve().parents[3] / "db" / "init"
SCHEMA_FILES = sorted(p for p in INIT_DIR.glob("0*.sql") if "seed" not in p.name)
# Lus à l'import : pas de lecture de fichier bloquante dans une coroutine
SCHEMA_SQL = [path.read_text() for path in SCHEMA_FILES]


def pytest_collection_modifyitems(items: list[pytest.Item]) -> None:
    if TEST_DATABASE_URL:
        return
    skip = pytest.mark.skip(reason="TEST_DATABASE_URL absente")
    for item in items:
        if "integration" in item.path.parts:
            item.add_marker(skip)


async def _apply(connection: AsyncConnection, sql: str) -> None:
    """Joue un fichier ; s'il a déjà été joué (base de dev), on l'ignore."""
    try:
        async with connection.begin_nested():
            await connection.exec_driver_sql(sql)
    except ProgrammingError as exc:
        if "already exists" not in str(exc):
            raise


async def _ensure_schema(connection: AsyncConnection) -> None:
    for sql in SCHEMA_SQL:
        await _apply(connection, sql)


@pytest.fixture
async def session() -> AsyncIterator[AsyncSession]:
    assert TEST_DATABASE_URL
    engine = create_async_engine(to_async_url(TEST_DATABASE_URL))
    async with engine.connect() as connection:
        transaction = await connection.begin()
        await _ensure_schema(connection)
        # « join external transaction » : session.commit() → RELEASE SAVEPOINT
        async with AsyncSession(
            bind=connection, join_transaction_mode="create_savepoint"
        ) as session:
            yield session
        await transaction.rollback()
    await engine.dispose()
