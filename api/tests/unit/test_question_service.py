import pytest

from app.core.errors import AIProviderError
from app.services.questions import LATEST_LIMIT, QuestionService
from tests.fakes import FakeAnswerProvider, FakeQuestionRepository


async def test_ask_stores_question_with_ai_answer() -> None:
    repository = FakeQuestionRepository()
    service = QuestionService(repository, FakeAnswerProvider("Paris."))

    created = await service.ask("Capitale de la France ?")

    assert (created.question, created.answer) == ("Capitale de la France ?", "Paris.")
    assert repository.rows == [created]


async def test_ask_stores_nothing_when_ai_fails() -> None:
    repository = FakeQuestionRepository()
    service = QuestionService(repository, FakeAnswerProvider(fail=True))

    with pytest.raises(AIProviderError):
        await service.ask("Bonjour ?")

    assert repository.rows == []


async def test_latest_returns_most_recent_first_and_limited() -> None:
    repository = FakeQuestionRepository()
    service = QuestionService(repository, FakeAnswerProvider())
    for index in range(LATEST_LIMIT + 2):
        await service.ask(f"Question {index}")

    latest = await service.latest()

    assert len(latest) == LATEST_LIMIT
    assert latest[0].question == f"Question {LATEST_LIMIT + 1}"
