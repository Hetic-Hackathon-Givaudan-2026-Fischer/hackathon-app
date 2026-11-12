import pytest
from fastapi.testclient import TestClient

from tests.fakes import FakeTrendSource

URL = "/api/v1/trends"


def ids(body: dict) -> list[str]:
    return [item["id"] for item in body["items"]]


def test_list_is_sorted_by_growth_and_carries_origin(client: TestClient) -> None:
    body = client.get(URL).json()

    assert ids(body) == ["mango", "acai", "cumin"]
    assert (body["origin"], body["data_date"]) == ("data_ai", "2026-11-10")
    assert (body["total"], body["page"], body["page_size"]) == (3, 1, 20)
    assert body["items"][0]["indicators"]["wiki_croissance_12m_relative"] == 30.0


@pytest.mark.parametrize(
    ("params", "expected"),
    [
        ({"family": "fruits"}, ["mango", "acai"]),
        ({"status": "buzz"}, ["acai"]),
        ({"product_type": "glaces"}, ["acai"]),
        ({"sort": "buzz_score"}, ["mango", "acai", "cumin"]),
        ({"search": "ACAÏ"}, ["acai"]),
        ({"sort": "name", "order": "asc"}, ["acai", "cumin", "mango"]),
        ({"page": 2, "page_size": 2}, ["cumin"]),
    ],
)
def test_list_filters_sorts_and_paginates(
    client: TestClient, params: dict, expected: list[str]
) -> None:
    assert ids(client.get(URL, params=params).json()) == expected


@pytest.mark.parametrize(
    "params",
    [{"sort": "inconnu"}, {"page": 0}, {"page_size": 101}, {"order": "up"}],
)
def test_list_rejects_invalid_params(client: TestClient, params: dict) -> None:
    assert client.get(URL, params=params).status_code == 422


def test_detail(client: TestClient) -> None:
    body = client.get(f"{URL}/acai").json()

    assert (body["id"], body["status"], body["score"]) == ("acai", "buzz", 0.4)
    assert (body["origin"], body["series"]) == ("data_ai", [])
    assert body["main_product_type"] == "boissons"
    assert [share["id"] for share in body["product_types"]] == ["boissons", "glaces"]
    assert body["analysis"] is None


def test_detail_carries_analysis(client: TestClient) -> None:
    analysis = client.get(f"{URL}/mango").json()["analysis"]

    assert (analysis["status"], analysis["buzz_score"]) == ("growing", 80)
    assert analysis["confidence"] == "high"


def test_unknown_trend_is_404(client: TestClient) -> None:
    response = client.get(f"{URL}/inconnu")

    assert response.status_code == 404
    assert response.json() == {"detail": "Arôme inconnu : inconnu"}


@pytest.mark.parametrize("trend_source", [FakeTrendSource(origin="csv_fallback")])
def test_empty_fallback_is_an_empty_page(client: TestClient) -> None:
    body = client.get(URL).json()

    assert (body["origin"], body["items"], body["total"]) == ("csv_fallback", [], 0)
