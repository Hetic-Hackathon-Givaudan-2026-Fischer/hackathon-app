import pytest
from fastapi.testclient import TestClient

from tests.fakes import FakeDatabaseProbe

URL = "/api/v1/health"


def test_health_reports_database_version(client: TestClient) -> None:
    response = client.get(URL)

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "db": "PostgreSQL 17.0"}


@pytest.mark.parametrize("probe", [FakeDatabaseProbe(version=None)])
def test_health_returns_503_when_database_is_down(client: TestClient) -> None:
    response = client.get(URL)

    assert response.status_code == 503
    assert response.json()["detail"].startswith("Base injoignable")


def test_swagger_is_served_under_api(client: TestClient) -> None:
    assert client.get("/api/docs").status_code == 200
    assert "/api/v1/questions" in client.get("/api/openapi.json").json()["paths"]
