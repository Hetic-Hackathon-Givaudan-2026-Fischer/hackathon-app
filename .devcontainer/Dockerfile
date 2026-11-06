# Image du conteneur « dev » (Zed / VS Code) : la même base que install, api et web
# (Node 24 officiel sur Debian trixie, utilisateur node en uid 1000), plus les
# outils du poste de travail : git (éditeur, hook husky) et psql 17 (comme le serveur)
FROM node:24-trixie-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates git openssh-client postgresql-client \
    && rm -rf /var/lib/apt/lists/*
