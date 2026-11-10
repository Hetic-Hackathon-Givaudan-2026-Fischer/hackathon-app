import logging
from typing import Any

import httpx
from pydantic import SecretStr

from app.core.errors import AIProviderError

# Un petit modèle local peut mettre du temps à générer : on lui laisse 2 minutes
LLM_TIMEOUT = 120.0
# Machine en veille, tunnel coupé : on abandonne au bout de 30 secondes
DATA_TEAM_TIMEOUT = 30.0

logger = logging.getLogger(__name__)


async def _post_json(
    http: httpx.AsyncClient, label: str, url: str, **kwargs: Any
) -> Any:
    """POST JSON ; toute erreur réseau ou HTTP devient une AIProviderError.

    Le détail amont (corps de la réponse, message réseau) va dans les logs de
    l'API, pas au client : il peut contenir des informations du fournisseur.
    """
    try:
        response = await http.post(url, **kwargs)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        logger.warning("%s : %s %s", label, status, exc.response.text[:500])
        raise AIProviderError(label, f"erreur {status}") from exc
    # InvalidURL : AI_BASE_URL / DATA_AI_URL mal formée dans api/.env
    except (httpx.HTTPError, httpx.InvalidURL, ValueError) as exc:
        logger.warning("%s : %r", label, exc)
        raise AIProviderError(label, "indisponible") from exc


def _unexpected(label: str, data: Any) -> AIProviderError:
    logger.warning("%s : réponse inattendue %r", label, data)
    return AIProviderError(label, "réponse inattendue")


def _read(label: str, data: Any, *path: str | int) -> str:
    """Suit `path` dans la réponse JSON ; seul un texte est une réponse valide."""
    value = data
    try:
        for key in path:
            value = value[key]
    except (KeyError, IndexError, TypeError) as exc:
        raise _unexpected(label, data) from exc
    if not isinstance(value, str):
        raise _unexpected(label, data)
    return value


class OpenAICompatibleProvider:
    """Endpoint /chat/completions : même appel pour Ollama, Mistral, OpenAI…

    Seule la configuration change (voir docs/adr/0001-client-ia.md).
    """

    label = "IA"

    def __init__(
        self, http: httpx.AsyncClient, base_url: str, model: str, api_key: SecretStr
    ) -> None:
        self._http = http
        self._url = f"{base_url.rstrip('/')}/chat/completions"
        self._model = model
        self._api_key = api_key

    async def answer(self, question: str) -> str:
        payload = {
            "model": self._model,
            "messages": [{"role": "user", "content": question}],
        }
        data = await _post_json(
            self._http,
            self.label,
            self._url,
            json=payload,
            headers=self._headers(),
            timeout=LLM_TIMEOUT,
        )
        return _read(self.label, data, "choices", 0, "message", "content")

    def _headers(self) -> dict[str, str]:
        # Ollama n'a pas de clé : « Bearer  » vide est un en-tête invalide pour httpx
        key = self._api_key.get_secret_value()
        return {"Authorization": f"Bearer {key}"} if key else {}


class DataTeamProvider:
    """L'API de l'équipe Data/IA, derrière son tunnel ngrok.

    Le contrat : son Swagger (<DATA_AI_URL>/docs).
    """

    label = "IA Data"

    def __init__(self, http: httpx.AsyncClient, base_url: str, api_key: SecretStr):
        self._http = http
        self._url = f"{base_url.rstrip('/')}/answer"
        self._api_key = api_key

    async def answer(self, question: str) -> str:
        headers = {"X-API-Key": self._api_key.get_secret_value()}
        data = await _post_json(
            self._http,
            self.label,
            self._url,
            json={"question": question},
            headers=headers,
            timeout=DATA_TEAM_TIMEOUT,
        )
        return _read(self.label, data, "answer")
