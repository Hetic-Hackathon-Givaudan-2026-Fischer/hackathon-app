# 0003. Tester l'API avec pytest et lancer les tests en CI

- Statut : acceptée
- Date : 2026-11-10 (révise la version du 2026-11-08, qui retenait Vitest pour l'API Express)
- Décideurs : Arnaud Fischer

## Contexte

Plusieurs personnes modifient l'API en parallèle : une régression ne doit pas atteindre `develop`. L'API Data/IA n'est pas disponible en CI.

## Options

1. pytest + pytest-asyncio : standard Python, fixtures, tests `async`.
2. `unittest` : sans dépendance, plus verbeux.
3. Pas de tests : aucune protection.

## Décision

Option 1 (groupe `dev` de [`api/pyproject.toml`](../../api/pyproject.toml), `asyncio_mode = "auto"`), dans [`api/tests/`](../../api/tests/) :

| Dossier                                        | Teste                           | Base et Data/IA                                                                                                                |
| ---------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [`unit/`](../../api/tests/unit/)               | services, clients, deps, config | faux de [`fakes.py`](../../api/tests/fakes.py) ; HTTP simulé par `httpx.MockTransport`                                         |
| [`api/`](../../api/tests/api/)                 | routes, codes HTTP              | vrais services ; adaptateurs remplacés par `app.dependency_overrides` ([`conftest.py`](../../api/tests/api/conftest.py))       |
| [`integration/`](../../api/tests/integration/) | repositories SQL                | PostgreSQL 17 via `TEST_DATABASE_URL`, transaction annulée par test ([`conftest.py`](../../api/tests/integration/conftest.py)) |

Règles :

- Toute nouvelle logique de service s'accompagne de ses tests.
- L'API Data/IA est toujours simulée (fixtures de [`tests/fixtures/data_ai/`](../../api/tests/fixtures/data_ai/)). Jamais d'appel réel.
- Un nouveau `Protocol` dans [`services/ports.py`](../../api/app/services/ports.py) a son faux dans `fakes.py`.
- Les tests d'intégration jouent tous les [`db/init/0*.sql`](../../db/init/) sauf le seed, et vérifient que chaque table existe ; sans `TEST_DATABASE_URL`, ils sont sautés.
- CI : job `api` de [`.github/workflows/tests.yml`](../../.github/workflows/tests.yml) (service `postgres:17`, `uv run pytest`) sur chaque PR et push sur `main` / `develop`.
- End-to-end (Playwright, « ouvrir le dashboard, voir les arômes ») : seulement si le temps le permet, pas encore en place.

## Conséquences

- Positives : régression bloquée dans la PR ; `uv run pytest` marche sans Docker ; rien ne reste en base.
- Négatives : faux à maintenir ; CI plus longue (service PostgreSQL) ; protection de branche sur `develop` nécessaire pour bloquer la fusion.
- À revoir si : passage à Alembic (les tests d'intégration jouent les migrations) ; end-to-end trop lents en CI ; temps manquant (garder au minimum les tests d'API).
