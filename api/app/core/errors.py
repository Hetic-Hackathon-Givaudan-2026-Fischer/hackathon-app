"""Erreurs métier : levées par les couches basses, traduites en HTTP par app/api."""


class AIProviderError(Exception):
    """L'IA n'a pas répondu, ou pas dans le format attendu."""

    def __init__(self, label: str, detail: str) -> None:
        super().__init__(f"{label} : {detail}")


class DatabaseUnavailableError(Exception):
    """PostgreSQL est injoignable."""
