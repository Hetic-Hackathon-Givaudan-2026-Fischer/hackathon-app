import pytest
from fastapi.testclient import TestClient

from tests.fakes import FakeDatabaseProbe, FakeTrendSource

URL = "/api/v1/health"


def test_health_reports_database_version(client: TestClient) -> None:
    response = client.get(URL)

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "db": "PostgreSQL 17.0",
        "data_ai": "non_configuree",
    }


@pytest.mark.parametrize("data_ai", [FakeTrendSource(fail=True)])
def test_health_stays_ok_when_data_ai_is_down(client: TestClient) -> None:
    response = client.get(URL)

    assert response.status_code == 200
    assert response.json()["data_ai"] == "down"


@pytest.mark.parametrize("probe", [FakeDatabaseProbe(version=None)])
def test_health_returns_503_when_database_is_down(client: TestClient) -> None:
    response = client.get(URL)

    assert response.status_code == 503
    assert response.json()["detail"].startswith("Base injoignable")


def test_swagger_is_served_under_api(client: TestClient) -> None:
    assert client.get("/api/docs").status_code == 200
    paths = client.get("/api/openapi.json").json()["paths"]
    assert {"/api/v1/trends", "/api/v1/report"} <= paths.keys()
    assert "/api/v1/questions" not in paths


def test_every_response_has_a_request_id(client: TestClient) -> None:
    generated = client.get(URL).headers["X-Request-ID"]
    kept = client.get(URL, headers={"X-Request-ID": "front-1"}).headers["X-Request-ID"]

    assert len(generated) == 32
    assert kept == "front-1"
