from typing import cast

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DataIssue
from app.repositories.base import insert
from app.services.ports import DataIssueRecord, IssueStatus, NewDataIssue, Origin


def _to_record(row: DataIssue) -> DataIssueRecord:
    return DataIssueRecord(
        id=row.id,
        trend_id=row.trend_id,
        message=row.message,
        contact=row.contact,
        request_id=row.request_id,
        # Valeurs garanties par les CHECK de db/init/003-report-issues.sql
        data_origin=cast(Origin, row.data_origin),
        status=cast(IssueStatus, row.status),
        created_at=row.created_at,
    )


class SqlDataIssueRepository:
    """DataIssueRepository sur PostgreSQL, via SQLAlchemy."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, issue: NewDataIssue) -> DataIssueRecord:
        row = DataIssue(
            trend_id=issue.trend_id,
            message=issue.message,
            contact=issue.contact,
            request_id=issue.request_id,
            data_origin=issue.data_origin,
        )
        return await insert(self._session, row, _to_record)
