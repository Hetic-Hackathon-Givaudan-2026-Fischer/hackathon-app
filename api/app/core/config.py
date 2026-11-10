from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ASYNC_DRIVER = "postgresql+asyncpg://"
# Formes courantes d'URL PostgreSQL : on garde celle de .env.example lisible
# (postgres://…) et on choisit le pilote async ici, une seule fois
_PLAIN_PREFIXES = ("postgres://", "postgresql://")
# api/.env, quel que soit le dossier d'où l'API (ou pytest) est lancée
ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


def to_async_url(url: str) -> str:
    """Remplace le schéma d'une URL PostgreSQL par celui du pilote asyncpg."""
    for prefix in _PLAIN_PREFIXES:
        if url.startswith(prefix):
            return ASYNC_DRIVER + url.removeprefix(prefix)
    return url


class Settings(BaseSettings):
    """Configuration lue dans l'environnement, puis dans api/.env."""

    # En dev, la configuration vient de api/.env ; en production, de l'hébergeur
    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")

    database_url: str
    # Mode 1 : n'importe quel fournisseur compatible OpenAI (Ollama, Mistral…)
    ai_base_url: str = ""
    ai_model: str = ""
    ai_api_key: SecretStr = SecretStr("")
    # Mode 2 : l'API de l'équipe Data/IA, prioritaire dès que l'URL est renseignée
    data_ai_url: str | None = None
    data_ai_key: SecretStr = SecretStr("")

    @field_validator("database_url")
    @classmethod
    def _use_async_driver(cls, url: str) -> str:
        return to_async_url(url)

    @field_validator("data_ai_url")
    @classmethod
    def _empty_means_unset(cls, url: str | None) -> str | None:
        # `DATA_AI_URL=` vide dans .env : on reste en mode 1
        return url or None


@lru_cache
def get_settings() -> Settings:
    """Settings lus une seule fois par processus."""
    # Valeurs lues dans l'environnement : rien à passer au constructeur
    return Settings()  # type: ignore[call-arg]
