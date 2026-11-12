"""Réponses d'erreur documentées dans l'OpenAPI, communes à toutes les routes."""

from typing import Any

from fastapi import status

from app.schemas.error import ErrorRead

_DESCRIPTIONS = {
    status.HTTP_404_NOT_FOUND: "Ressource inconnue",
    status.HTTP_410_GONE: "Lien showroom expiré ou révoqué",
    status.HTTP_503_SERVICE_UNAVAILABLE: "Base ou source de données injoignable",
}


def error_responses(*codes: int) -> dict[int | str, dict[str, Any]]:
    """`responses=` d'une route : le format ErrorRead pour chaque code listé."""
    return {
        code: {"model": ErrorRead, "description": _DESCRIPTIONS[code]} for code in codes
    }
