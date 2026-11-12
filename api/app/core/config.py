from functools import lru_cache
from pathlib import Path

from pydantic import Field, SecretStr, field_validator
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
    # API Data/IA « FlavorTrends » (ADR 0008) ; vide : CSV de repli seul
    data_ai_url: str | None = None
    data_ai_key: SecretStr = SecretStr("")
    # Au-delà, l'API Data/IA est jugée injoignable : le CSV prend le relais
    data_ai_timeout_seconds: float = Field(default=5.0, gt=0)
    # Liens showroom (ADR 0010) : URL du front et durée de vie par défaut
    public_web_url: str = "http://localhost:5173"
    showroom_link_ttl_hours: int = Field(default=72, ge=1, le=720)

    @field_validator("database_url")
    @classmethod
    def _use_async_driver(cls, url: str) -> str:
        return to_async_url(url)

    @field_validator("data_ai_url")
    @classmethod
    def _empty_means_unset(cls, url: str | None) -> str | None:
        # `DATA_AI_URL=` vide dans .env : CSV de repli seul
        return url or None


@lru_cache
def get_settings() -> Settings:
    """Settings lus une seule fois par processus."""
    # Valeurs lues dans l'environnement : rien à passer au constructeur
    return Settings()  # type: ignore[call-arg]
