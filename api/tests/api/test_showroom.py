import pytest
from fastapi.testclient import TestClient

from app.services.showroom import hash_token
from tests.fakes import FakeShowroomLinkRepository

URL = "/api/v1/showroom"


def create(client: TestClient, **body: object) -> dict:
    response = client.post(f"{URL}/links", json={"client_label": "Client"} | body)
    assert response.status_code == 201
    return response.json()


def test_create_returns_token_once(
    client: TestClient, links: FakeShowroomLinkRepository
) -> None:
    created = create(client, families=["fruits"], ttl_hours=2)

    assert created["token"] == "token-1"
    assert created["url"] == "http://web.test/showroom/token-1"
    assert created["state"] == "active"
    assert list(links.hashes) == [hash_token("token-1")]
    listed = client.get(f"{URL}/links").json()
    assert "token" not in listed[0]
    assert "url" not in listed[0]


@pytest.mark.parametrize(
    "body",
    [{"client_label": "  "}, {"client_label": "C", "ttl_hours": 0},
     {"client_label": "C", "ttl_hours": 721}],
)  # fmt: skip
def test_create_rejects_invalid_body(client: TestClient, body: dict) -> None:
    assert client.post(f"{URL}/links", json=body).status_code == 422


def test_view_is_limited_to_scope_and_read_only(client: TestClient) -> None:
    token = create(client, families=["fruits"])["token"]

    body = client.get(f"{URL}/{token}").json()

    assert body["client_label"] == "Client"
    assert [t["id"] for t in body["trends"]] == ["acai", "mango"]
    # Rien du dashboard ni du rapport : pas d'indicateurs bruts
    assert "indicators" not in body["trends"][0]
    assert client.post(f"{URL}/{token}").status_code == 405


def test_unknown_token_is_404(client: TestClient) -> None:
    assert client.get(f"{URL}/inconnu").status_code == 404


def test_revoked_link_is_410(client: TestClient) -> None:
    created = create(client)

    assert client.delete(f"{URL}/links/{created['id']}").status_code == 204
    assert client.delete(f"{URL}/links/{created['id']}").status_code == 204
    response = client.get(f"{URL}/{created['token']}")

    assert response.status_code == 410
    assert client.get(f"{URL}/links").json()[0]["state"] == "revoked"


def test_revoke_unknown_link_is_404(client: TestClient) -> None:
    assert client.delete(f"{URL}/links/42").status_code == 404
