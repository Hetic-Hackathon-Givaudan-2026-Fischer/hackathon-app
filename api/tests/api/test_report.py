import pytest
from fastapi.testclient import TestClient

from app.schemas.report import ISSUE_MESSAGE_MAX_LENGTH
from app.services.ports import ConfusionMatrix, ModelMetrics, ModelScore
from tests.api.conftest import TRENDS
from tests.fakes import FakeDataIssueRepository, FakeModelMetrics, FakeTrendSource

URL = "/api/v1/report"
METRICS = ModelMetrics(
    models=(
        ModelScore(
            "V2",
            "Régression",
            0.82,
            0.77,
            0.68,
            f1=0.88,
            confusion=ConfusionMatrix(54, 9, 6, 13),
        ),
    ),
    validation="leave-one-flavor-out",
)


def test_dataset_report(client: TestClient) -> None:
    body = client.get(URL).json()

    assert (body["origin"], body["trend_count"]) == ("data_ai", 3)
    assert body["provenance"]["model_applied"] is True
    assert body["status"] in {"ok", "warning", "error"}
    assert {i["source"] for i in body["indicators"]} >= {"wikipedia", "pinterest"}
    assert [s["order"] for s in body["steps"]] == [1, 2, 3, 4]
    assert {q["key"] for q in body["quality"]} >= {"missing:wikipedia"}


@pytest.mark.parametrize("trend_source", [FakeTrendSource(TRENDS)])
def test_dataset_report_in_fallback(client: TestClient) -> None:
    body = client.get(URL).json()

    assert body["origin"] == "csv_fallback"
    assert body["provenance"]["model_applied"] is False
    assert body["status"] != "ok"


def test_trend_report(client: TestClient) -> None:
    body = client.get(f"{URL}/trends/cumin").json()

    assert body["trend"]["id"] == "cumin"
    values = {i["key"]: i["value"] for i in body["indicators"]}
    assert values["produits_total"] == 3.0
    assert client.get(f"{URL}/trends/inconnu").status_code == 404


def test_model_report_unavailable_is_200(client: TestClient) -> None:
    response = client.get(f"{URL}/model")

    assert response.status_code == 200
    body = response.json()
    assert (body["available"], body["models"]) == (False, [])
    assert body["reason"]


@pytest.mark.parametrize("model_metrics", [FakeModelMetrics(METRICS)])
def test_model_report_available(client: TestClient) -> None:
    body = client.get(f"{URL}/model").json()

    assert (body["available"], body["validation"]) == (True, "leave-one-flavor-out")
    model = body["models"][0]
    assert (model["balanced_accuracy"], model["buzz_detected"]) == (0.77, 0.68)
    assert model["confusion"]["buzz_predicted_buzz"] == 13


def test_issue_records_request_id_and_origin(
    client: TestClient, issues: FakeDataIssueRepository
) -> None:
    response = client.post(
        f"{URL}/issues",
        json={"trend_id": "acai", "message": "  Bizarre  ", "contact": "a@b.fr"},
        headers={"X-Request-ID": "front-7"},
    )

    assert response.status_code == 201
    body = response.json()
    assert (body["message"], body["request_id"]) == ("Bizarre", "front-7")
    assert (body["data_origin"], body["status"]) == ("data_ai", "open")
    assert len(issues.rows) == 1


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"message": "   "},
        {"message": "a" * (ISSUE_MESSAGE_MAX_LENGTH + 1)},
        {"message": "ok", "contact": "pas-un-mail"},
    ],
)
def test_issue_rejects_invalid_body(client: TestClient, payload: dict) -> None:
    assert client.post(f"{URL}/issues", json=payload).status_code == 422


def test_issue_on_unknown_trend_is_404(client: TestClient) -> None:
    response = client.post(f"{URL}/issues", json={"trend_id": "x", "message": "?"})

    assert response.status_code == 404
