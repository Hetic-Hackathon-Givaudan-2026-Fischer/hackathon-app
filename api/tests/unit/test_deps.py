import httpx
from pydantic import SecretStr

from app.api.deps import get_answer_provider
from app.clients.ai import DataTeamProvider, OpenAICompatibleProvider
from app.core.config import Settings


def settings(**overrides: object) -> Settings:
    values = {
        "database_url": "postgres://app:app@db:5432/app",
        "ai_base_url": "http://ollama/v1",
        "ai_model": "llama3.2:1b",
        "ai_api_key": SecretStr(""),
    }
    return Settings(_env_file=None, **(values | overrides))  # type: ignore[arg-type]


def test_answer_provider_defaults_to_openai_compatible() -> None:
    provider = get_answer_provider(settings(), httpx.AsyncClient())

    assert isinstance(provider, OpenAICompatibleProvider)


def test_answer_provider_prefers_data_team_when_url_is_set() -> None:
    provider = get_answer_provider(
        settings(data_ai_url="https://x.ngrok.app"), httpx.AsyncClient()
    )

    assert isinstance(provider, DataTeamProvider)


def test_answer_provider_ignores_empty_data_team_url() -> None:
    provider = get_answer_provider(settings(data_ai_url=""), httpx.AsyncClient())

    assert isinstance(provider, OpenAICompatibleProvider)
