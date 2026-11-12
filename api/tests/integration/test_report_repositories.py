from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.data_issues import SqlDataIssueRepository
from app.repositories.showroom_links import SqlShowroomLinkRepository
from app.services.ports import NewDataIssue, NewShowroomLink

EXPIRES = datetime(2030, 1, 1, tzinfo=UTC)


async def test_issue_is_saved_open_with_origin(session: AsyncSession) -> None:
    issue = NewDataIssue("acai", "Valeur aberrante", None, "req-1", "csv_fallback")

    created = await SqlDataIssueRepository(session).add(issue)

    assert created.id > 0
    assert (created.status, created.data_origin) == ("open", "csv_fallback")
    assert (created.trend_id, created.request_id) == ("acai", "req-1")
    assert created.created_at.tzinfo is not None


def new_link(token_hash: str, families: tuple[str, ...] = ()) -> NewShowroomLink:
    return NewShowroomLink(token_hash, "Client", families, EXPIRES)


async def test_link_round_trip_by_hash(session: AsyncSession) -> None:
    repository = SqlShowroomLinkRepository(session)

    created = await repository.add(new_link("h1", ("agrumes", "epice")))

    assert created.families == ("agrumes", "epice")
    assert created.expires_at == EXPIRES
    assert await repository.find_by_hash("h1") == created
    assert await repository.find_by_hash("absent") is None
    assert await repository.get(created.id) == created


async def test_links_are_listed_newest_first(session: AsyncSession) -> None:
    repository = SqlShowroomLinkRepository(session)
    first = await repository.add(new_link("h2"))
    second = await repository.add(new_link("h3"))

    listed = [link.id for link in await repository.list_all()]

    assert listed.index(second.id) < listed.index(first.id)


async def test_revoke_sets_revoked_at(session: AsyncSession) -> None:
    repository = SqlShowroomLinkRepository(session)
    created = await repository.add(new_link("h4"))
    at = datetime.now(UTC) - timedelta(minutes=1)

    revoked = await repository.revoke(created.id, at)

    assert revoked is not None and revoked.revoked_at == at
    assert await repository.revoke(999_999, at) is None
