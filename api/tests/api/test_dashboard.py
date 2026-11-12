from fastapi.testclient import TestClient


def test_summary(client: TestClient) -> None:
    body = client.get("/api/v1/dashboard/summary").json()

    assert body["origin"] == "data_ai"
    counts = (body["trend_count"], body["family_count"], body["scored_count"])
    assert counts == (3, 2, 2)
    assert body["status_counts"] == {"buzz": 1, "emergent": 1}
    assert body["totals"]["produits_total"] == 3.0
    assert [t["id"] for t in body["top_growing"]] == ["mango", "acai", "cumin"]


def test_families(client: TestClient) -> None:
    body = client.get("/api/v1/families").json()

    assert body["origin"] == "data_ai"
    assert body["items"] == [
        {"family": "epice", "trend_count": 1, "average_growth": None},
        {"family": "fruits", "trend_count": 2, "average_growth": 20.0},
    ]
