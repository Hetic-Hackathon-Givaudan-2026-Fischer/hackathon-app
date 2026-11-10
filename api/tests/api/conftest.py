from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.api.deps import (
    get_answer_provider,
    get_database_probe,
    get_question_repository,
)
from app.main import app
from tests.fakes import FakeAnswerProvider, FakeDatabaseProbe, FakeQuestionRepository


@pytest.fixture
def repository() -> FakeQuestionRepository:
    return FakeQuestionRepository()


@pytest.fixture
def provider() -> FakeAnswerProvider:
    return FakeAnswerProvider("Paris.")


@pytest.fixture
def probe() -> FakeDatabaseProbe:
    return FakeDatabaseProbe()


@pytest.fixture
def client(
    repository: FakeQuestionRepository,
    provider: FakeAnswerProvider,
    probe: FakeDatabaseProbe,
) -> Iterator[TestClient]:
    # On ne remplace que les adaptateurs (base, IA) : les services et leur
    # câblage dans deps.py sont les vrais. Sans `with`, le lifespan ne tourne pas
    app.dependency_overrides[get_question_repository] = lambda: repository
    app.dependency_overrides[get_answer_provider] = lambda: provider
    app.dependency_overrides[get_database_probe] = lambda: probe
    yield TestClient(app)
    app.dependency_overrides.clear()
