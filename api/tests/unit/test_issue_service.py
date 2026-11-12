import pytest

from app.core.errors import NotFoundError
from app.services.issues import IssueService
from app.services.ports import Origin
from tests.fakes import FakeDataIssueRepository, FakeTrendSource, make_trend


def service(
    origin: Origin = "csv_fallback",
) -> tuple[IssueService, FakeDataIssueRepository]:
    repository = FakeDataIssueRepository()
    source = FakeTrendSource([make_trend("acai")], origin=origin)
    return IssueService(repository, source), repository


async def test_issue_records_origin_and_request_id() -> None:
    issues, repository = service("data_ai")

    created = await issues.report("acai", "Valeur aberrante", None, "req-1")

    assert (created.data_origin, created.request_id) == ("data_ai", "req-1")
    assert (created.trend_id, created.status) == ("acai", "open")
    assert repository.rows == [created]


async def test_global_issue_uses_dataset_origin() -> None:
    issues, _ = service("csv_fallback")

    created = await issues.report(None, "Rapport vide", "it@example.com", "req-2")

    assert (created.trend_id, created.data_origin) == (None, "csv_fallback")


async def test_issue_on_unknown_trend_is_not_saved() -> None:
    issues, repository = service()

    with pytest.raises(NotFoundError):
        await issues.report("inconnu", "?", None, "req-3")
    assert repository.rows == []
