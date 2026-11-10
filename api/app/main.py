from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI

from app.api.errors import register_exception_handlers
from app.api.v1.router import API_V1_PREFIX, api_router
from app.core.config import get_settings
from app.db.session import create_engine, create_session_factory

DESCRIPTION = """
Questions posées à l'IA et réponses enregistrées dans PostgreSQL.

L'IA est choisie dans `api/.env` : un fournisseur compatible OpenAI (mode 1),
ou l'API de l'équipe Data/IA dès que `DATA_AI_URL` est renseignée (mode 2).
"""

TAGS = [
    {"name": "santé", "description": "Healthcheck de l'API et de la base."},
    {"name": "questions", "description": "Poser une question, relire l'historique."},
]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Pool PostgreSQL et client HTTP : créés une fois, partagés, fermés à l'arrêt."""
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
    return app


app = create_app()
