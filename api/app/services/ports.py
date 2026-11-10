"""Ports des services : ce dont la logique métier a besoin, sans dire comment.

Les implémentations (SQLAlchemy, httpx) vivent dans app/repositories et
app/clients ; seul app/api/deps.py les relie à ces Protocols.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Protocol


@dataclass(frozen=True, slots=True)
class QuestionRecord:
    """Une question enregistrée, indépendante de l'ORM et du format de l'API."""

    id: int
    question: str
    answer: str
    created_at: datetime


class QuestionRepository(Protocol):
    """Stockage des questions."""

    async def list_latest(self, limit: int) -> list[QuestionRecord]: ...

    async def add(self, question: str, answer: str) -> QuestionRecord: ...


class DatabaseProbe(Protocol):
    """Sonde de la base, pour le healthcheck."""

    async def server_version(self) -> str: ...


class AnswerProvider(Protocol):
    """Une IA : une réponse à une question."""

    async def answer(self, question: str) -> str: ...
