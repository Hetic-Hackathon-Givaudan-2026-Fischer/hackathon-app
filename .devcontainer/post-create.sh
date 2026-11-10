#!/bin/sh
# Réglages propres au poste de travail « dev ».
# npm ci et api/.env : déjà faits par le service « install » de compose.yml,
# qui tourne avant « dev » (depends_on), donc pas ici.
set -e
cd /workspace

git config --global --add safe.directory /workspace
# Branche le hook pre-commit : l'image slim d'« install » n'a pas git pour le faire
npm run prepare
# api/.venv pour l'éditeur (autocomplétion, ruff, pytest). Le conteneur « api »
# a son propre environnement dans son image (/opt/venv) : les deux ne se gênent pas
uv sync --locked --project api
# Utilise le login `gh` pour git push/pull ; sans login, on continue
gh auth setup-git || true
