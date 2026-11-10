# Image du conteneur « dev » (Zed / VS Code) : la même base que install et web
# (Node 24 officiel sur Debian trixie, utilisateur node en uid 1000), plus les
# outils du poste de travail : git (éditeur, hook husky), psql 17 (comme le
# serveur), et Python 3.13 + uv pour l'API (même Python que l'image api/Dockerfile)
FROM node:24-trixie-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates git openssh-client postgresql-client python3 \
    && rm -rf /var/lib/apt/lists/*

# uv épinglé (même version que api/Dockerfile et la CI) : binaire autonome
COPY --from=ghcr.io/astral-sh/uv:0.11.11 /uv /uvx /usr/local/bin/

# uv utilise le Python 3.13 de Debian, sans en télécharger un autre :
# api/.venv reste aligné sur la version de l'image de l'API
ENV UV_PYTHON_DOWNLOADS=never \
    UV_PYTHON_PREFERENCE=only-system
