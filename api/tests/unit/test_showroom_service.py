from datetime import UTC, datetime, timedelta

import pytest

from app.core.errors import GoneError, NotFoundError
from app.services.showroom import (
    MAX_TTL_HOURS,
    ShowroomLinkService,
    ShowroomSettings,
    ShowroomViewService,
    hash_token,
)
from tests.fakes import (
    FakeShowroomLinkRepository,
    FakeTokenGenerator,
    FakeTrendSource,
    make_trend,
)

NOW = datetime(2026, 11, 12, 9, 0, tzinfo=UTC)
CATALOG = [make_trend("cumin", "epice"), make_trend("yuzu", "agrumes")]
SETTINGS = ShowroomSettings(public_web_url="http://web:5173/", default_ttl_hours=72)


class Clock:
    def __init__(self) -> None:
        self.now = NOW

    def __call__(self) -> datetime:
        return self.now


@pytest.fixture
def repository() -> FakeShowroomLinkRepository:
    return FakeShowroomLinkRepository()


@pytest.fixture
def clock() -> Clock:
    return Clock()


@pytest.fixture
def links(repository: FakeShowroomLinkRepository, clock: Clock) -> ShowroomLinkService:
    return ShowroomLinkService(repository, FakeTokenGenerator(), SETTINGS, now=clock)


def test_hash_is_sha256_hex() -> None:
    assert len(hash_token("token-1")) == 64
    assert hash_token("token-1") != hash_token("token-2")


async def test_create_stores_only_the_hash(
    links: ShowroomLinkService, repository: FakeShowroomLinkRepository
) -> None:
    created = await links.create("Client", [" epice", "agrumes", "epice"], None)

    assert created.token == "token-1"
    assert created.url == "http://web:5173/showroom/token-1"
    assert list(repository.hashes) == [hash_token("token-1")]
    assert created.link.families == ("agrumes", "epice")
    assert created.link.expires_at == NOW + timedelta(hours=72)
    assert created.state == "active"


async def test_ttl_is_capped(links: ShowroomLinkService) -> None:
    created = await links.create("Client", [], 10_000)

    assert created.link.expires_at == NOW + timedelta(hours=MAX_TTL_HOURS)


async def test_resolve_active_link(links: ShowroomLinkService) -> None:
    created = await links.create("Client", [], 1)

    assert (await links.resolve(created.token)).id == created.link.id


async def test_unknown_token_is_not_found(links: ShowroomLinkService) -> None:
    with pytest.raises(NotFoundError):
        await links.resolve("inconnu")


async def test_expired_link_is_gone(links: ShowroomLinkService, clock: Clock) -> None:
    created = await links.create("Client", [], 1)
    clock.now = NOW + timedelta(hours=1)

    with pytest.raises(GoneError):
        await links.resolve(created.token)
    assert (await links.list())[0].state == "expired"


async def test_revoked_link_is_gone_and_revoke_is_idempotent(
    links: ShowroomLinkService,
) -> None:
    created = await links.create("Client", [], None)

    await links.revoke(created.link.id)
    await links.revoke(created.link.id)

    with pytest.raises(GoneError):
        await links.resolve(created.token)
    assert (await links.list())[0].state == "revoked"


async def test_revoke_unknown_link_is_not_found(links: ShowroomLinkService) -> None:
    with pytest.raises(NotFoundError):
        await links.revoke(42)


async def test_view_is_limited_to_link_families(links: ShowroomLinkService) -> None:
    source = FakeTrendSource(CATALOG)
    created = await links.create("Client", ["epice"], None)

    view = await ShowroomViewService(links, source).view(created.token)

    assert [t.id for t in view.trends.value] == ["cumin"]
    assert view.trends.status.origin == "csv_fallback"


async def test_view_without_families_shows_everything(
    links: ShowroomLinkService,
) -> None:
    source = FakeTrendSource(CATALOG)
    created = await links.create("Client", [], None)

    view = await ShowroomViewService(links, source).view(created.token)

    assert len(view.trends.value) == 2
