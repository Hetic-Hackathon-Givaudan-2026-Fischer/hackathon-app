"""Liens showroom : un jeton opaque, montré une fois, stocké haché (ADR 0010)."""

import hashlib
from collections.abc import Callable, Iterable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Literal

from app.core.errors import GoneError, NotFoundError
from app.services.ports import (
    NewShowroomLink,
    ShowroomLinkRecord,
    ShowroomLinkRepository,
    Sourced,
    TokenGenerator,
    TrendRecord,
    TrendSource,
)

MAX_TTL_HOURS = 720
LinkState = Literal["active", "expired", "revoked"]
Clock = Callable[[], datetime]


def utc_now() -> datetime:
    return datetime.now(UTC)


def hash_token(token: str) -> str:
    """SHA-256 suffit : le jeton a 256 bits d'entropie, pas besoin de sel."""
    return hashlib.sha256(token.encode()).hexdigest()


def normalize_families(families: Iterable[str]) -> tuple[str, ...]:
    return tuple(sorted({family.strip() for family in families if family.strip()}))


def link_state(link: ShowroomLinkRecord, now: datetime) -> LinkState:
    if link.revoked_at is not None:
        return "revoked"
    return "expired" if link.expires_at <= now else "active"


@dataclass(frozen=True, slots=True)
class ManagedLink:
    link: ShowroomLinkRecord
    state: LinkState


@dataclass(frozen=True, slots=True)
class CreatedLink:
    """Le seul moment où le jeton en clair existe côté API."""

    link: ShowroomLinkRecord
    state: LinkState
    token: str
    url: str


@dataclass(frozen=True, slots=True)
class ShowroomView:
    link: ShowroomLinkRecord
    trends: Sourced[list[TrendRecord]]


@dataclass(frozen=True, slots=True)
class ShowroomSettings:
    public_web_url: str
    default_ttl_hours: int


class ShowroomLinkService:
    """Créer, lister, révoquer et résoudre les liens showroom."""

    def __init__(
        self,
        repository: ShowroomLinkRepository,
        tokens: TokenGenerator,
        settings: ShowroomSettings,
        now: Clock = utc_now,
    ) -> None:
        self._repository = repository
        self._tokens = tokens
        self._settings = settings
        self._now = now

    async def create(
        self, client_label: str, families: Iterable[str], ttl_hours: int | None
    ) -> CreatedLink:
        token = self._tokens.new_token()
        hours = min(ttl_hours or self._settings.default_ttl_hours, MAX_TTL_HOURS)
        link = await self._repository.add(
            NewShowroomLink(
                token_hash=hash_token(token),
                client_label=client_label,
                families=normalize_families(families),
                expires_at=self._now() + timedelta(hours=hours),
            )
        )
        return CreatedLink(link, self._state(link), token, self._url(token))

    async def list(self) -> list[ManagedLink]:
        links = await self._repository.list_all()
        return [ManagedLink(link, self._state(link)) for link in links]

    async def revoke(self, link_id: int) -> None:
        """Idempotent : révoquer un lien déjà révoqué ne change rien."""
        link = await self._repository.get(link_id)
        if link is None:
            raise NotFoundError(f"Lien showroom inconnu : {link_id}")
        if link.revoked_at is None:
            await self._repository.revoke(link_id, self._now())

    async def resolve(self, token: str) -> ShowroomLinkRecord:
        """Jeton inconnu → NotFoundError (404) ; expiré ou révoqué → GoneError (410)."""
        link = await self._repository.find_by_hash(hash_token(token))
        if link is None:
            raise NotFoundError("Lien showroom inconnu")
        if self._state(link) != "active":
            raise GoneError("Lien showroom expiré ou révoqué")
        return link

    def _state(self, link: ShowroomLinkRecord) -> LinkState:
        return link_state(link, self._now())

    def _url(self, token: str) -> str:
        return f"{self._settings.public_web_url.rstrip('/')}/showroom/{token}"


class ShowroomViewService:
    """Ce que voit un client : les arômes du périmètre de son lien, rien d'autre."""

    def __init__(self, links: ShowroomLinkService, source: TrendSource) -> None:
        self._links = links
        self._source = source

    async def view(self, token: str) -> ShowroomView:
        link = await self._links.resolve(token)
        result = await self._source.list_trends()
        trends = [t for t in result.value if _in_scope(t, link.families)]
        return ShowroomView(link=link, trends=Sourced(trends, result.status))


def _in_scope(trend: TrendRecord, families: tuple[str, ...]) -> bool:
    return not families or trend.family in families
