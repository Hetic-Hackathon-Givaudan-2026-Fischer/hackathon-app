# AGENTS.md

Consignes pour les agents IA (Claude Code, Codex…) qui travaillent sur ce dépôt. Le contexte complet est dans le [README](README.md).

## Le projet

Socle de hackathon : un front React + TypeScript + Tailwind sur Vite (`web/`), une API FastAPI + Python 3.13 (`api/`), PostgreSQL 17 (`db/`) et l'API de l'équipe Data/IA (tendances d'arômes, CSV en repli), le tout lancé avec Docker Compose.

```
navigateur ──► web (Vite, :5173) ──/api──► api (FastAPI, :3000) ──► db (PostgreSQL, :5433)
                                                │
                                                ├──► API de l'équipe Data/IA (ngrok)   (DATA_AI_URL renseignée)
                                                └──► CSV de repli (api/app/data/)      (DATA_AI_URL vide, ou Data/IA coupée)
```

La documentation, les ADR et les commentaires sont en **français** : garde cette langue.

## Décisions

Le cadre des agents (priorités, quel ADR lire, écarts avec les skills) est dans [ADR 0006](docs/adr/0006-cadre-agents-ia.md). L'essentiel :

- Priorité : ADR « acceptée » > ce fichier > skill > tes habitudes.
- Lis l'ADR concerné avant d'ajouter une dépendance ou de changer de composant.
- Ne contredis pas un ADR « acceptée ». Pour en changer : nouvel ADR « proposée » depuis [`0000-modele.md`](docs/adr/0000-modele.md), puis arrête-toi.

## Règles de dev

- **DRY** : avant d'écrire une fonction, cherche un équivalent dans le code. Une logique répétée deux fois ou plus se factorise ; un type, une constante ou un schéma n'a qu'une seule source.
- **Clean code** : fonctions courtes, une seule responsabilité, noms explicites, pas de code mort.
- **SOLID**, si nécessaire et possible : les services dépendent d'interfaces (`Protocol` dans `app/services/ports.py`), pas d'implémentations ; on étend par une nouvelle implémentation plutôt qu'en modifiant du code stable.
- **Secrets** : jamais dans le code ni dans git. Tout passe par `api/.env` (ignoré) ; seul `api/.env.example` est commité, sans vraie valeur.

## L'API (`api/app/`)

Architecture en couches ([ADR 0004](docs/adr/0004-backend-fastapi.md)) :

| Couche                  | Rôle                                                                      |
| ----------------------- | ------------------------------------------------------------------------- |
| `api/v1/endpoints/`     | Routes minces : schéma en entrée → service → schéma en sortie.            |
| `api/v1/router.py`      | Regroupe les endpoints de la v1.                                          |
| `api/deps.py`           | Injection (`Depends`) : **seul** endroit qui choisit les implémentations. |
| `services/`             | Logique métier ; ne dépend que des `Protocol` de `services/ports.py`.     |
| `repositories/`         | Requêtes SQL (SQLAlchemy async + asyncpg).                                |
| `clients/` (tendances)  | Data/IA, CSV de repli et bascule derrière `TrendSource` (ADR 0008).       |
| `models/` / `schemas/`  | Tables SQLAlchemy / entrées-sorties Pydantic.                             |
| `core/config.py`, `db/` | Configuration (`pydantic-settings`, lit `api/.env`), connexion.           |

- Jamais de SQL ni de logique métier dans un endpoint.
- Le format des réponses Data/IA n'est connu que de `clients/data_trends.py` ; chaque réponse de données porte `origin` ([ADR 0008](docs/adr/0008-source-tendances-repli.md)).
- Liens showroom : jeton haché, jamais dans les logs ([ADR 0010](docs/adr/0010-liens-showroom.md)).
- `openapi.yaml` se régénère avec `uv run python -m app.scripts.export_openapi` (contrôlé en CI).
- Une nouvelle version d'API se crée à côté (`api/v2/`), sans casser la v1.
- Le schéma de la base est dans `db/init/*.sql` (joué au premier démarrage seulement) ; pas d'Alembic.
- Dépendances avec `uv add` (dans `api/`) : commite `pyproject.toml` **et** `uv.lock`.
- Pour les conventions FastAPI (`Annotated`, types de retour, routers…), suis le skill `.agents/skills/fastapi`.

## Le front (`web/src/`)

React + Tailwind pour l'interface, three.js impératif pour la scène ([ADR 0007](docs/adr/0007-front-react.md)) :

| Dossier         | Rôle                                                                      |
| --------------- | ------------------------------------------------------------------------- |
| `components/`   | Composants React, classes Tailwind ; jamais d'import de `three`.          |
| `hooks/`        | `useExperience` : monte / libère le moteur, expose son état à React.      |
| `engine/`       | Moteur three.js ; entrée unique `createExperience`, libéré par `dispose`. |
| `engine/scene/` | Un dossier par élément de la scène, `index.ts` comme seule surface.       |

- Types partagés du moteur : `engine/types.ts` ; outils canvas : `engine/scene/shared/canvas.ts`.
- Jetons de la charte : `@theme` dans `index.css`, alignés sur `brand.ts`.

## Tests

pytest, sur trois niveaux, dans `api/tests/` :

- `unit/` : services et clients, avec des faux (`tests/fakes.py`) ;
- `api/` : les routes, dépendances remplacées par `app.dependency_overrides` ;
- `integration/` : les repositories sur un vrai PostgreSQL, sautés si `TEST_DATABASE_URL` n'est pas défini.

L'API Data/IA est toujours simulée (fixtures enregistrées). Toute nouvelle logique de service s'accompagne de ses tests.

## Commandes

Deux terminaux à distinguer :

| Où                                  | Commandes                                                   |
| ----------------------------------- | ----------------------------------------------------------- |
| Machine hôte                        | `./setup.sh`, `docker compose …`                            |
| Dev container (`node@…:/workspace`) | `npm run lint`, `npm run format`, `uv run …`, `git`, `psql` |

Dans `api/` :

```bash
uv run ruff check      # lint (--fix pour corriger)
uv run ruff format     # formatage
uv run pytest          # tests
```

À la racine : `npm run lint` (ESLint), `npm run format:check` (Prettier). Le hook pre-commit (husky + lint-staged) lance ESLint, Prettier et ruff sur les fichiers indexés.

Avant de rendre la main : `ruff check`, `ruff format` et `pytest` passent dans `api/`, `npm run lint` et `npm run format:check` à la racine.
