from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ShowroomLink
from app.repositories.base import insert
from app.repositories.errors import db_errors
from app.services.ports import NewShowroomLink, ShowroomLinkRecord


def _to_record(row: ShowroomLink) -> ShowroomLinkRecord:
    return ShowroomLinkRecord(
        id=row.id,
        client_label=row.client_label,
        families=tuple(row.families),
        expires_at=row.expires_at,
        revoked_at=row.revoked_at,
        created_at=row.created_at,
    )


class SqlShowroomLinkRepository:
    """ShowroomLinkRepository sur PostgreSQL : seul le hash du jeton y entre."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, link: NewShowroomLink) -> ShowroomLinkRecord:
        row = ShowroomLink(
            token_hash=link.token_hash,
            client_label=link.client_label,
            families=list(link.families),
            expires_at=link.expires_at,
        )
        return await insert(self._session, row, _to_record)

    async def list_all(self) -> list[ShowroomLinkRecord]:
        query = select(ShowroomLink).order_by(ShowroomLink.id.desc())
        with db_errors():
            rows = await self._session.scalars(query)
        return [_to_record(row) for row in rows]

    async def get(self, link_id: int) -> ShowroomLinkRecord | None:
        with db_errors():
            row = await self._session.get(ShowroomLink, link_id)
        return _to_record(row) if row else None

    async def find_by_hash(self, token_hash: str) -> ShowroomLinkRecord | None:
        query = select(ShowroomLink).where(ShowroomLink.token_hash == token_hash)
        with db_errors():
            row = await self._session.scalar(query)
        return _to_record(row) if row else None

    async def revoke(self, link_id: int, at: datetime) -> ShowroomLinkRecord | None:
        query = (
            update(ShowroomLink)
            .where(ShowroomLink.id == link_id)
            .values(revoked_at=at)
            .returning(ShowroomLink)
        )
        with db_errors():
            row = await self._session.scalar(query)
            record = _to_record(row) if row else None
            await self._session.commit()
        return record
