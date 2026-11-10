from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Question
from app.repositories.errors import db_errors
from app.services.ports import QuestionRecord


def _to_record(row: Question) -> QuestionRecord:
    return QuestionRecord(
        id=row.id, question=row.question, answer=row.answer, created_at=row.created_at
    )


class SqlQuestionRepository:
    """QuestionRepository sur PostgreSQL, via SQLAlchemy."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_latest(self, limit: int) -> list[QuestionRecord]:
        query = select(Question).order_by(Question.id.desc()).limit(limit)
        with db_errors():
            rows = await self._session.scalars(query)
        return [_to_record(row) for row in rows]

    async def add(self, question: str, answer: str) -> QuestionRecord:
        row = Question(question=question, answer=answer)
        self._session.add(row)
        with db_errors():
            # flush : INSERT … RETURNING id, created_at (eager_defaults). Le
            # record est lu avant le commit, qui pourrait expirer l'objet
            await self._session.flush()
            record = _to_record(row)
            await self._session.commit()
        return record
