# 0004. Écrire l'API en Python avec FastAPI

- Statut : acceptée
- Date : 2026-11-10
- Décideurs : Arnaud Fischer

## Contexte

L'API initiale était en Express + TypeScript. L'équipe (trois Data/IA, un dev lead) est plus à l'aise en Python, et l'équipe Data/IA expose déjà une API FastAPI. Une partie du code est générée par des agents IA : sans cadre strict, leurs choix divergent.

## Options

1. Garder Express : rien à réécrire ; langage moins maîtrisé, structure libre, pas de doc d'API générée.
2. FastAPI : Python, Swagger généré, validation Pydantic, async ; réécriture et second écosystème (uv).
3. Django + DRF : trop de concepts pour trois routes, synchrone par défaut.
4. Flask : ni validation ni doc intégrées.

## Décision

Option 2. Structure en couches dans [`api/app/`](../../api/app/) :

| Dossier / fichier                                                            | Rôle                                                                  |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [`api/v1/endpoints/`](../../api/app/api/v1/endpoints/)                       | Routes minces : schéma → service → schéma.                            |
| [`api/v1/router.py`](../../api/app/api/v1/router.py)                         | Regroupe les endpoints v1.                                            |
| [`api/deps.py`](../../api/app/api/deps.py)                                   | Injection (`Depends`) : seul endroit qui choisit les implémentations. |
| [`api/errors.py`](../../api/app/api/errors.py)                               | Erreurs métier → réponses HTTP.                                       |
| [`services/`](../../api/app/services/)                                       | Logique métier ; ne dépend que des `Protocol` de `ports.py`.          |
| [`repositories/`](../../api/app/repositories/)                               | SQL (SQLAlchemy async + asyncpg).                                     |
| [`clients/`](../../api/app/clients/)                                         | API Data/IA et CSV de repli ([0008](0008-source-tendances-repli.md)). |
| [`models/`](../../api/app/models/) / [`schemas/`](../../api/app/schemas/)    | Tables SQLAlchemy / entrées-sorties Pydantic.                         |
| [`core/config.py`](../../api/app/core/config.py), [`db/`](../../api/app/db/) | Configuration (`api/.env`), connexion.                                |

Règles :

- Jamais de SQL ni de logique métier dans un endpoint.
- Un service ne dépend que d'un `Protocol`, jamais d'une implémentation.
- Nouvelle version d'API : `api/v2/` à côté, sans casser la v1.
- Routes sous `/api/v1` ; Swagger sur `/api/docs`.
- Codes d'erreur : `422` entrée invalide (Pydantic), `503` base injoignable ; `404`, `410` et `500` : voir [0008](0008-source-tendances-repli.md). Le détail technique reste dans les logs, jamais dans la réponse.
- Schéma de base dans `db/init/*.sql` (joué au premier démarrage) ; pas d'Alembic.
- Dépendances : `uv add` dans `api/`, commiter `pyproject.toml` **et** `uv.lock`.
- Python 3.13 : celui de Debian trixie dans [`api/Dockerfile`](../../api/Dockerfile) et le dev container, celui de l'image uv en CI. Port 3000.

## Conséquences

- Positives : toute l'équipe peut travailler sur l'API ; Swagger toujours à jour ; entrées invalides rejetées sans code ; base et API Data/IA simulables ([0003](0003-tests.md)) ; cadre clair pour les agents IA.
- Négatives : deux écosystèmes (npm pour le front, uv pour l'API) et deux jeux d'outils qualité (ESLint/Prettier, ruff).
- À revoir si : le schéma évolue souvent (passer à Alembic) ; Python n'est plus le langage commun de l'équipe.
