import pytest
from fastapi.testclient import TestClient

from app.services.ports import Sourced, TrendRecord
from tests.fakes import FakeTrendSource


class ExplodingSource(FakeTrendSource):
    """Une panne non prévue, avec des détails qui ne doivent pas sortir."""

    async def list_trends(self) -> Sourced[list[TrendRecord]]:
        raise RuntimeError("détail interne à ne pas exposer")


@pytest.mark.parametrize("trend_source", [ExplodingSource()])
def test_unexpected_error_is_a_generic_500(client: TestClient) -> None:
    response = client.get("/api/v1/dashboard/summary")

    assert response.status_code == 500
    assert response.json() == {"detail": "Erreur interne"}
    assert "X-Request-ID" in response.headers
