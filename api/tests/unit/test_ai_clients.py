import json
from collections.abc import Callable

import httpx
import pytest
from pydantic import SecretStr

from app.clients.ai import DataTeamProvider, OpenAICompatibleProvider
from app.core.errors import AIProviderError

Handler = Callable[[httpx.Request], httpx.Response]


def client(handler: Handler) -> httpx.AsyncClient:
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


def openai_provider(handler: Handler) -> OpenAICompatibleProvider:
    return OpenAICompatibleProvider(
        client(handler), "http://ollama/v1/", "llama3.2:1b", SecretStr("sk")
    )


def data_team_provider(handler: Handler) -> DataTeamProvider:
    return DataTeamProvider(client(handler), "https://x.ngrok.app", SecretStr("k"))


async def test_openai_compatible_sends_contract_and_reads_content() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert str(request.url) == "http://ollama/v1/chat/completions"
        assert request.headers["Authorization"] == "Bearer sk"
        body = json.loads(request.content)
        assert body["model"] == "llama3.2:1b"
        assert body["messages"] == [{"role": "user", "content": "Bonjour ?"}]
        return httpx.Response(200, json={"choices": [{"message": {"content": "Hi"}}]})

    assert await openai_provider(handler).answer("Bonjour ?") == "Hi"


async def test_openai_compatible_without_key_sends_no_authorization() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert "Authorization" not in request.headers
        return httpx.Response(200, json={"choices": [{"message": {"content": "Hi"}}]})

    provider = OpenAICompatibleProvider(
        client(handler), "http://ollama/v1", "llama3.2:1b", SecretStr("")
    )
    assert await provider.answer("?") == "Hi"


async def test_data_team_sends_api_key_and_reads_answer() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert str(request.url) == "https://x.ngrok.app/answer"
        assert request.headers["X-API-Key"] == "k"
        assert json.loads(request.content) == {"question": "Bonjour ?"}
        return httpx.Response(200, json={"answer": "Salut", "model": "m"})

    assert await data_team_provider(handler).answer("Bonjour ?") == "Salut"


async def test_http_error_becomes_ai_provider_error() -> None:
    provider = openai_provider(lambda _: httpx.Response(404, text="model not found"))

    with pytest.raises(AIProviderError, match=r"^IA : erreur 404$"):
        await provider.answer("?")


async def test_network_error_becomes_ai_provider_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectTimeout("timeout", request=request)

    with pytest.raises(AIProviderError, match=r"^IA Data : indisponible$"):
        await data_team_provider(handler).answer("?")


async def test_unexpected_payload_becomes_ai_provider_error() -> None:
    provider = data_team_provider(lambda _: httpx.Response(200, json={"oops": 1}))

    with pytest.raises(AIProviderError, match="réponse inattendue"):
        await provider.answer("?")


@pytest.mark.parametrize("content", [None, 42, ["Hi"]])
async def test_non_text_content_becomes_ai_provider_error(content: object) -> None:
    payload = {"choices": [{"message": {"content": content}}]}
    provider = openai_provider(lambda _: httpx.Response(200, json=payload))

    with pytest.raises(AIProviderError, match=r"^IA : réponse inattendue$"):
        await provider.answer("?")


@pytest.mark.parametrize("base_url", ["", "http://exa mple:abc/v1"])
async def test_invalid_base_url_becomes_ai_provider_error(base_url: str) -> None:
    provider = OpenAICompatibleProvider(
        httpx.AsyncClient(), base_url, "m", SecretStr("")
    )

    with pytest.raises(AIProviderError, match=r"^IA : indisponible$"):
        await provider.answer("?")
