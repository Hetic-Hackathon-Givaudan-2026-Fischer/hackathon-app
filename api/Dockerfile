FROM ghcr.io/astral-sh/uv:0.11.11-python3.13-trixie-slim AS base

# venv hors de /workspace : le montage du code (compose.yml) ne le masque pas,
# et il ne se mélange pas avec api/.venv du dev container.

ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    UV_PYTHON_DOWNLOADS=never \
    UV_LINK_MODE=copy \
    PATH=/opt/venv/bin:$PATH

# Même uid que sur l'hôte (1000) : les fichiers créés restent les tiens.
# Propriétaire du venv : `uv run --locked` peut le resynchroniser au démarrage
RUN groupadd --gid 1000 app \
    && useradd --uid 1000 --gid app --create-home app \
    && install -d -o app -g app /opt/venv /workspace/api

WORKDIR /workspace/api
USER app

# Dev => rechargé à chaque modification
FROM base AS dev

# Couche de dépendances : reconstruite seulement si pyproject.toml ou uv.lock changent
RUN --mount=type=cache,target=/home/app/.cache/uv,uid=1000,gid=1000 \
    --mount=type=bind,source=api/pyproject.toml,target=pyproject.toml \
    --mount=type=bind,source=api/uv.lock,target=uv.lock \
    --mount=type=bind,source=api/.python-version,target=.python-version \
    uv sync --locked --no-install-project

EXPOSE 3000
# 0.0.0.0 : joignable hors du conteneur. `uv run --locked` resynchronise le venv
# si uv.lock a changé depuis la construction de l'image. --reload-dir app : ne
# surveille que le code, pas api/.venv (dev container) ni les tests
CMD ["uv", "run", "--locked", "uvicorn", "app.main:app", "--reload", "--reload-dir", "app", "--host", "0.0.0.0", "--port", "3000"]

# Production : code copié dans l'image, sans les outils de dev
FROM base AS prod

# Bytecode précompilé : démarrage plus rapide, pas d'écriture de .pyc à l'exécution
ENV UV_COMPILE_BYTECODE=1

RUN --mount=type=cache,target=/home/app/.cache/uv,uid=1000,gid=1000 \
    --mount=type=bind,source=api/pyproject.toml,target=pyproject.toml \
    --mount=type=bind,source=api/uv.lock,target=uv.lock \
    --mount=type=bind,source=api/.python-version,target=.python-version \
    uv sync --locked --no-install-project --no-dev

COPY --chown=app:app api/app ./app

EXPOSE 3000
CMD ["fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "3000"]
