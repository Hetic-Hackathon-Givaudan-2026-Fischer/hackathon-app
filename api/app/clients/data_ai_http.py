"""Transport HTTP vers l'API Data/IA : authentification et traduction des erreurs.

Le format des réponses, lui, n'est connu que de app/clients/data_trends.py.
"""

from typing import Any

import httpx
from pydantic import SecretStr

from app.core.errors import DataSourceUnavailableError, NotFoundError

API_PREFIX = "/api/v1"
# En-tête posé par ngrok sur ses propres pages d'erreur (tunnel hors ligne…)
NGROK_ERROR_HEADER = "ngrok-error-code"


def data_ai_headers(api_key: SecretStr) -> dict[str, str]:
    """En-tête d'authentification Data/IA ; aucun si la clé est vide."""
    key = api_key.get_secret_value()
    return {"X-API-Key": key} if key else {}


def _is_api_not_found(response: httpx.Response) -> bool:
    """Un vrai 404 de l'API (JSON), pas la page HTML d'un tunnel ngrok coupé."""
    content_type = response.headers.get("content-type", "")
    return (
        response.status_code == httpx.codes.NOT_FOUND
        and content_type.startswith("application/json")
        and NGROK_ERROR_HEADER not in response.headers
    )


def _check_status(response: httpx.Response, not_found: str | None) -> None:
    if not_found and _is_api_not_found(response):
        raise NotFoundError(not_found)
    if response.is_error:
        raise DataSourceUnavailableError(f"erreur HTTP {response.status_code}")


def _decode(response: httpx.Response) -> Any:
    try:
        return response.json()
    except ValueError as exc:
        raise DataSourceUnavailableError("JSON illisible") from exc


class DataAiHttp:
    """GET / POST JSON vers l'API Data/IA ; toute panne : DataSourceUnavailableError.

    Les messages d'erreur ne contiennent jamais la clé d'API (elle n'est que
    dans les en-têtes, que l'on ne journalise pas).
    """

    def __init__(
        self, http: httpx.AsyncClient, base_url: str, api_key: SecretStr, timeout: float
    ) -> None:
        self._http = http
        self._base_url = f"{base_url.rstrip('/')}{API_PREFIX}"
        self._headers = data_ai_headers(api_key)
        self.timeout = timeout

    async def get_json(
        self,
        path: str,
        *,
        params: dict[str, str] | None = None,
        time_limit: float | None = None,
        not_found: str | None = None,
    ) -> Any:
        """`not_found` : message du 404 attendu ; sinon un 404 déclenche le repli."""
        time_limit = time_limit or self.timeout
        response = await self._send("GET", path, time_limit, params=params)
        _check_status(response, not_found)
        return _decode(response)

    async def post_json(self, path: str, body: dict[str, Any]) -> Any:
        """Calcul sans état chez Data/IA : rien n'y est enregistré."""
        response = await self._send("POST", path, self.timeout, json=body)
        _check_status(response, None)
        return _decode(response)

    async def _send(
        self, method: str, path: str, time_limit: float, **options: Any
    ) -> httpx.Response:
        url = f"{self._base_url}{path}"
        try:
            return await self._http.request(
                method, url, headers=self._headers, timeout=time_limit, **options
            )
        except (httpx.HTTPError, httpx.InvalidURL) as exc:
            raise DataSourceUnavailableError(
                f"injoignable ({type(exc).__name__})"
            ) from exc
