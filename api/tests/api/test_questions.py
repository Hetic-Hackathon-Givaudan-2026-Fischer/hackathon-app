import pytest
from fastapi.testclient import TestClient

from app.schemas.question import QUESTION_MAX_LENGTH
from tests.fakes import FakeAnswerProvider, FakeQuestionRepository

URL = "/api/v1/questions"


def test_post_creates_question_with_answer(client: TestClient) -> None:
    response = client.post(URL, json={"question": "  Capitale de la France ?  "})

    assert response.status_code == 201
    body = response.json()
    assert (body["question"], body["answer"]) == ("Capitale de la France ?", "Paris.")
    assert {"id", "created_at"} <= body.keys()


@pytest.mark.parametrize("payload", [{}, {"question": ""}, {"question": "   "}])
def test_post_rejects_missing_question(client: TestClient, payload: dict) -> None:
    assert client.post(URL, json=payload).status_code == 422


def test_post_rejects_too_long_question(client: TestClient) -> None:
    question = "a" * (QUESTION_MAX_LENGTH + 1)

    assert client.post(URL, json={"question": question}).status_code == 422


def test_get_lists_latest_first(client: TestClient) -> None:
    client.post(URL, json={"question": "Première"})
    client.post(URL, json={"question": "Seconde"})

    response = client.get(URL)

    assert response.status_code == 200
    assert [q["question"] for q in response.json()] == ["Seconde", "Première"]


@pytest.mark.parametrize("provider", [FakeAnswerProvider(fail=True)])
def test_post_returns_502_when_ai_fails(client: TestClient) -> None:
    response = client.post(URL, json={"question": "Bonjour ?"})

    assert response.status_code == 502
    assert response.json() == {"detail": "IA : 503 indisponible"}


@pytest.mark.parametrize("repository", [FakeQuestionRepository(fail=True)])
def test_get_returns_503_when_database_is_down(client: TestClient) -> None:
    response = client.get(URL)

    assert response.status_code == 503
    assert response.json() == {"detail": "Base injoignable"}
