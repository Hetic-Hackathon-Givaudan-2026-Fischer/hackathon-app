# Python 3.13 de Debian trixie (comme le dev container) : sans pip ni ensurepip,
# uv gère le venv. Sert de base à toutes les cibles, y compris la prod (sans uv)
FROM debian:trixie-slim AS runtime

# upgrade : correctifs Debian publiés depuis la construction de l'image de base
# (sinon Trivy remonte les CVE corrigées d'apt, openssl, perl, util-linux, zlib…).
# ca-certificates : appels HTTPS sortants (vérification TLS)
RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends ca-certificates python3 \
    && rm -rf /var/lib/apt/lists/*

# venv hors de /workspace : le montage du code (compose.yml) ne le masque pas,
# et il ne se mélange pas avec api/.venv du dev container.
ENV PATH=/opt/venv/bin:$PATH

# Même uid que sur l'hôte (1000) : les fichiers créés restent les tiens.
# Propriétaire du venv : `uv run --locked` peut le resynchroniser au démarrage
RUN groupadd --gid 1000 app \
    && useradd --uid 1000 --gid app --create-home app \
    && install -d -o app -g app /opt/venv /workspace/api

WORKDIR /workspace/api

# Outillage uv (dev et construction du venv de prod), jamais dans l'image finale.
# uv épinglé : même version que .devcontainer/Dockerfile et la CI
FROM runtime AS base

COPY --from=ghcr.io/astral-sh/uv:0.13.7 /uv /uvx /usr/local/bin/

# Python système uniquement : le venv pointe sur /usr/bin/python3.13, présent à
# l'identique dans l'image de prod
ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    UV_PYTHON_DOWNLOADS=never \
    UV_PYTHON_PREFERENCE=only-system \
    UV_LINK_MODE=copy

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

# Construction du venv de prod (sans les outils de dev)
FROM base AS builder

# Bytecode précompilé : démarrage plus rapide, pas d'écriture de .pyc à l'exécution
ENV UV_COMPILE_BYTECODE=1

RUN --mount=type=cache,target=/home/app/.cache/uv,uid=1000,gid=1000 \
    --mount=type=bind,source=api/pyproject.toml,target=pyproject.toml \
    --mount=type=bind,source=api/uv.lock,target=uv.lock \
    --mount=type=bind,source=api/.python-version,target=.python-version \
    uv sync --locked --no-install-project --no-dev

# Production : uniquement Python, le venv et le code. Pas de binaire uv/uvx
# (moins de surface d'attaque, et leurs dépendances Rust hors du scan Trivy)
FROM runtime AS prod

COPY --from=builder --chown=app:app /opt/venv /opt/venv
COPY --chown=app:app api/app ./app

USER app
EXPOSE 3000
CMD ["fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "3000"]
