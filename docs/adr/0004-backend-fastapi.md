# 0004. Écrire l'API en Python avec FastAPI

- Statut : acceptée
- Date : 2026-11-10
- Décideurs : Arnaud Fischer

## Contexte

Le socle a été préparé avant que l'équipe soit constituée, avec une API Express 5 + TypeScript (`api/src/index.ts`) : trois routes (`/api/health`, `GET` et `POST /api/questions`), PostgreSQL et deux modes d'IA ([0001](0001-client-ia.md)). [0003](0003-tests.md) prévoyait déjà que la stack pourrait changer une fois l'équipe connue, « par exemple un backend en Python avec Flask ou FastAPI ».

L'équipe est maintenant connue :

- trois personnes Data/IA, qui connaissent Python ;
- un dev lead qui connaît Python et y est plus à l'aise qu'avec du JavaScript côté backend.

Côté Data/IA, la majorité des outils modernes (modèles, traitement de données, évaluation, clients des fournisseurs) sont en Python. L'équipe Data/IA expose déjà sa propre API en FastAPI (mode 2, Swagger sur `<DATA_AI_URL>/docs`).

Le hackathon dure deux semaines et une partie du code sera générée par des agents IA (Claude Code, par exemple). Plus le cadre est flou, plus leurs choix divergent d'une session à l'autre.

## Options

1. Garder Express + TypeScript : rien à réécrire, outillage déjà en place (ESLint, Prettier, CI). La majorité de l'équipe y est moins à l'aise qu'en Python ; deux langages entre l'API et le travail Data/IA ; pas de documentation d'API générée ; la structure du code est libre, donc chacun (humain ou agent IA) l'organise à sa façon.
2. FastAPI : Python, le langage de toute l'équipe et de l'équipe Data/IA. Swagger généré depuis le code. Validation et réponses décrites par des schémas Pydantic. Async natif, rapide à démarrer. Il faut réécrire l'API et ajouter un second écosystème (Python, uv) à côté de Node pour le front.
3. Django + Django REST Framework : très complet (ORM, migrations, admin). Beaucoup de concepts et de configuration pour trois routes ; synchrone par défaut ; Swagger seulement via un paquet en plus.
4. Flask : léger et connu. Pas de validation ni de documentation intégrées : il faut choisir et assembler des extensions, donc plus de décisions laissées à chacun.

## Décision

Nous choisissons l'option 2, FastAPI, pour quatre raisons :

- **Organisation** : toute l'équipe connaît Python, et le dev lead y est plus efficace qu'en JavaScript backend. Les personnes Data/IA peuvent lire, relire et modifier l'API.
- **Cohérence d'environnement** : l'API utilise le même langage que les outils Data/IA et que l'API de l'équipe Data/IA. Du code ou un client peut passer de l'un à l'autre sans traduction.
- **Démarrage rapide** : FastAPI est optimisé et organisé pour lancer un nouveau projet simplement. Le Swagger intégré permet de tester les routes et de déboguer sans outil en plus ; c'est une documentation réelle, générée depuis le code, donc toujours à jour.
- **Un cadre qui limite les divergences** : les models (SQLAlchemy) et les schemas (Pydantic) fixent la forme des données à chaque couche. Un agent IA qui génère du code suit ce cadre au lieu d'inventer sa propre structure.

Mise en œuvre :

- **Structure versionnée et en couches**, dans `api/app/` :

  | Dossier / fichier       | Rôle                                                                      |
  | ----------------------- | ------------------------------------------------------------------------- |
  | `api/v1/endpoints/`     | Les routes, minces : aucune requête SQL ni logique métier.                |
  | `api/v1/router.py`      | Regroupe les endpoints de la version 1.                                   |
  | `api/deps.py`           | Injection (`Depends`) : seul endroit qui choisit les implémentations.     |
  | `services/`             | La logique métier ; ne dépend que d'interfaces (`Protocol`).              |
  | `repositories/`         | L'accès à PostgreSQL, derrière une interface.                             |
  | `clients/ai.py`         | Les deux modes d'IA derrière une interface `AnswerProvider`.              |
  | `models/`               | Les tables (ORM SQLAlchemy).                                              |
  | `schemas/`              | Les entrées et sorties de l'API (Pydantic).                               |
  | `core/config.py`, `db/` | Configuration (`pydantic-settings`, lit `api/.env`), connexion à la base. |

  Une nouvelle version d'API se crée à côté (`api/v2/`), sans casser les clients de la v1.

- **Routes sous `/api/v1`** : `GET /api/v1/health`, `GET` et `POST /api/v1/questions`. Le Swagger est sur `/api/docs` (ReDoc sur `/api/redoc`, schéma sur `/api/openapi.json`) : sous `/api`, il passe aussi par le proxy de Vite.
- **Python 3.13** : le CPython officiel de l'image uv (sur Debian trixie, comme le reste de la stack) pour l'API et la CI, le `python3` 3.13 de Debian dans le dev container. Dépendances gérées avec **uv** (`api/pyproject.toml`, `api/uv.lock` commité) : installation reproductible et rapide.
- **Base de données** : SQLAlchemy en mode async avec asyncpg. Le schéma reste dans `db/init/*.sql`, joué par PostgreSQL au premier démarrage : pas d'Alembic pour l'instant.
- **Mêmes variables dans `api/.env`** : un `api/.env` existant reste valable (`postgres://` est converti en `postgresql+asyncpg://`).
- **Port 3000 conservé** : ni Vite, ni `setup.sh`, ni les habitudes ne changent, et pas de conflit avec une API FastAPI de l'équipe Data/IA lancée en local sur le port 8000 par défaut.
- **Une image dédiée à l'API** : `api/Dockerfile`, avec une cible `dev` (utilisée par `compose.yml`, rechargement à chaque modification) et une cible `prod`. Le venv est dans l'image (`/opt/venv`), hors du dossier monté : il n'entre pas en conflit avec `api/.venv` du dev container. L'API se lance avec `uv run --locked`, qui met le venv à jour si `uv.lock` a changé.
- **Dev container** : Node 24 (front, ESLint, Prettier, hook pre-commit) plus Python 3.13 et uv (API, ruff, pytest).

## Conséquences

- Positives : toute l'équipe peut travailler sur l'API ; la documentation des routes est générée et toujours à jour ; les entrées invalides sont rejetées par les schémas sans code à écrire ; chaque accès externe (base, IA) passe par une interface injectée, donc se simule facilement en test ; la structure en couches donne un cadre clair aux humains comme aux agents IA.
- Négatives, à accepter :
  - deux écosystèmes : npm pour le front et les outils, uv pour l'API ;
  - deux jeux d'outils qualité : ESLint et Prettier pour le front, ruff pour Python ;
  - les URLs changent (`/api/v1/...`) ;
  - une question vide, absente ou qui n'est pas une chaîne renvoie `422` (validation Pydantic) au lieu de `400` (Express convertissait `123` en `"123"`) ;
  - une question est limitée à 4 000 caractères (Express limitait le corps à 100 ko) ;
  - une erreur de l'IA renvoie `502` avec un message court (`IA : erreur 404`, `IA Data : indisponible`…), le détail du fournisseur restant dans les logs de l'API ; une base injoignable renvoie `503` (Express renvoyait `500` dans les deux cas) ;
  - une modification de `api/Dockerfile` oblige à reconstruire l'image (`docker compose up -d --build api`) ;
  - [0001](0001-client-ia.md) reste valable (contrat compatible OpenAI, configuration dans `api/.env`), mais son implémentation a bougé : `httpx` dans `api/app/clients/ai.py` au lieu de `fetch` dans `api/src/index.ts` ;
  - [0003](0003-tests.md) est à réviser : Vitest et Supertest sont remplacés par pytest et httpx ; les trois niveaux de tests, la base PostgreSQL dédiée, l'IA simulée et le job de CI restent valables.
- À revoir si : le schéma de la base doit évoluer souvent ou sans perdre de données (passer à Alembic pour les migrations) ; nous avons besoin du streaming des réponses de l'IA ; la composition de l'équipe change et Python n'y est plus le langage commun.
