from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.api.deps import (
    get_data_ai_trend_source,
    get_data_issue_repository,
    get_database_probe,
    get_model_metrics_source,
    get_showroom_link_repository,
    get_token_generator,
    get_trend_source,
)
from app.core.config import Settings, get_settings
from app.main import app
from tests.fakes import (
    FakeDatabaseProbe,
    FakeDataIssueRepository,
    FakeModelMetrics,
    FakeShowroomLinkRepository,
    FakeTokenGenerator,
    FakeTrendSource,
    make_trend,
)

# Réglages explicites : en CI, ni api/.env ni DATABASE_URL
SETTINGS = Settings(
    _env_file=None,  # type: ignore[call-arg]
    database_url="postgres://test@localhost/test",
    public_web_url="http://web.test",
)

TRENDS = [
    make_trend(
        "acai", "fruits", "buzz", 0.4, "Açaï", wiki_croissance_12m_relative=10.0
    ),
    make_trend(
        "mango", "fruits", "emergent", 0.9, "Mangue", wiki_croissance_12m_relative=30.0
    ),
    make_trend("cumin", "epice", None, None, "Cumin", produits_total=3.0),
]


@pytest.fixture
def probe() -> FakeDatabaseProbe:
    return FakeDatabaseProbe()


@pytest.fixture
def trend_source() -> FakeTrendSource:
    return FakeTrendSource(TRENDS, origin="data_ai")


@pytest.fixture
def data_ai() -> FakeTrendSource | None:
    """La sonde Data/IA de /health ; None : DATA_AI_URL vide."""
    return None


@pytest.fixture
def model_metrics() -> FakeModelMetrics:
    return FakeModelMetrics()


@pytest.fixture
def issues() -> FakeDataIssueRepository:
    return FakeDataIssueRepository()


@pytest.fixture
def links() -> FakeShowroomLinkRepository:
    return FakeShowroomLinkRepository()


@pytest.fixture
def client(
    probe: FakeDatabaseProbe,
    trend_source: FakeTrendSource,
    data_ai: FakeTrendSource | None,
    model_metrics: FakeModelMetrics,
    issues: FakeDataIssueRepository,
    links: FakeShowroomLinkRepository,
) -> Iterator[TestClient]:
    # On ne remplace que les adaptateurs (base, sources de données) : les services et
    # leur câblage dans deps.py sont les vrais. Sans `with`, le lifespan ne tourne pas
    app.dependency_overrides |= {
        get_settings: lambda: SETTINGS,
        get_database_probe: lambda: probe,
        get_trend_source: lambda: trend_source,
        get_data_ai_trend_source: lambda: data_ai,
        get_model_metrics_source: lambda: model_metrics,
        get_data_issue_repository: lambda: issues,
        get_showroom_link_repository: lambda: links,
        get_token_generator: FakeTokenGenerator,
    }
    yield TestClient(app)
    app.dependency_overrides.clear()
