"""Faux partagés par les tests : implémentent les Protocols sans base ni réseau."""

from datetime import UTC, datetime

from app.core.errors import AIProviderError, DatabaseUnavailableError
from app.services.ports import QuestionRecord


class FakeQuestionRepository:
    def __init__(self, fail: bool = False) -> None:
        self.rows: list[QuestionRecord] = []
        self._fail = fail

    async def list_latest(self, limit: int) -> list[QuestionRecord]:
        if self._fail:
            raise DatabaseUnavailableError("connexion refusée")
        return sorted(self.rows, key=lambda row: row.id, reverse=True)[:limit]

    async def add(self, question: str, answer: str) -> QuestionRecord:
        row = QuestionRecord(
            id=len(self.rows) + 1,
            question=question,
            answer=answer,
            created_at=datetime.now(UTC),
        )
        self.rows.append(row)
        return row


class FakeAnswerProvider:
    def __init__(self, answer: str = "Paris.", fail: bool = False) -> None:
        self._answer = answer
        self._fail = fail
        self.questions: list[str] = []

    async def answer(self, question: str) -> str:
        self.questions.append(question)
        if self._fail:
            raise AIProviderError("IA", "503 indisponible")
        return self._answer


class FakeDatabaseProbe:
    def __init__(self, version: str | None = "PostgreSQL 17.0") -> None:
        self._version = version

    async def server_version(self) -> str:
        if self._version is None:
            raise DatabaseUnavailableError("connexion refusée")
        return self._version
