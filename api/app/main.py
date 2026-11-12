from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI

from app.api.errors import register_exception_handlers
from app.api.middleware import RequestContextMiddleware
from app.api.v1.router import API_V1_PREFIX, api_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db.session import create_engine, create_session_factory

DESCRIPTION = """
Interface interne Givaudan : tendances d'arômes, rapport d'analyse, showroom.

- **Tendances** : lues dans l'API Data/IA (`DATA_AI_URL`), ou dans le CSV de
  repli quand elle est vide ou injoignable. Chaque réponse porte `origin`
  (`data_ai` | `csv_fallback`) et `data_date`.
- **Rapport** : provenance, traitements et qualité des données ; signalements.
- **Showroom** : liens temporaires, sans compte, en lecture seule.

Chaque réponse porte un en-tête `X-Request-ID`, à communiquer au support.
"""

TAGS = [
    {"name": "santé", "description": "Healthcheck de l'API, de la base et de Data/IA."},
    {"name": "dashboard", "description": "KPI et familles d'arômes."},
    {"name": "tendances", "description": "Arômes : liste filtrable, fiche détaillée."},
    {"name": "rapport", "description": "Provenance, qualité, modèle ; signalements."},
    {"name": "showroom", "description": "Liens showroom temporaires (ADR 0010)."},
]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Logs JSON ; pool PostgreSQL et client HTTP créés une fois, fermés à l'arrêt."""
    configure_logging()
    engine = create_engine(get_settings().database_url)
    app.state.session_factory = create_session_factory(engine)
    try:
        async with httpx.AsyncClient() as http:
            app.state.http = http
            yield
    finally:
        await engine.dispose()


def create_app() -> FastAPI:
    # Swagger sous /api : joignable aussi via le proxy Vite (localhost:5173/api/docs)
    app = FastAPI(
        title="API Hackathon",
        description=DESCRIPTION,
        version="1.0.0",
        openapi_tags=TAGS,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )
    app.include_router(api_router, prefix=API_V1_PREFIX)
    register_exception_handlers(app)
    app.add_middleware(RequestContextMiddleware)
    return app


app = create_app()
