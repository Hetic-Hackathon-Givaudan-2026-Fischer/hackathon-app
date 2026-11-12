# Plan : aligner l'API sur le Swagger Data/IA 1.2.0

## Objectif

Le Swagger Data/IA (`docs/data/swagger-data/openapi.json`, v1.2.0) a désormais des
schémas de réponse et de nouvelles routes. Notre API doit lire ces données,
relayer les requêtes utiles, et le front doit les afficher.

| Route Data/IA                 | Chez nous                                                    |
| ----------------------------- | ------------------------------------------------------------ |
| `GET /trends`, `/trends/{id}` | + `name_en`, `main_product_type`, `product_types`            |
| `GET /ai/indicators`          | `analysis` sur chaque arôme (statut, buzz/trend score…)      |
| `GET /product-types`          | `GET /api/v1/product-types`, calculé dans le service         |
| `POST /simulate`              | `POST /api/v1/simulate` (calcul sans état, 503 sans Data/IA) |
| `GET /trends/{id}/insight`    | **non** : IA générative → ADR 0014 « proposée » (ADR 0011)   |
| `GET /ai/health`, `/packet`   | non utilisés                                                 |

Corrections du contrat : `evidence.title/url` et `series[].value` nullables
(94 vidéos YouTube sans URL en réel).

## Couches touchées

1. **Ports** (`services/ports.py`) : `ProductShare`, `TrendAnalysis`,
   `SimulationInput`, `SimulationResult`, `PerennitySimulator` ; champs ajoutés à
   `TrendRecord` ; `Evidence.title/url` optionnels.
2. **Clients** : `data_ai_http.py` (+ `post_json`), `data_trends.py` (lecture des
   nouveaux champs, `/ai/indicators` toléré en panne, `DataTeamSimulator`),
   `fallback.py` (`UnavailableSimulator`).
3. **Services** : `trends.py` (filtre `product_type`, tri buzz/trend score,
   stats par type de produit), `simulation.py` (nouveau).
4. **API** : schémas `trend.py`, `simulation.py` ; endpoints `dashboard.py`
   (`/product-types`), `trends.py` (filtre), `simulation.py` ; `deps.py`.
5. **Tests** : fixtures réenregistrées (+ `ai_indicators.json`, `simulate.json`),
   unit (client, service), api (routes).
6. **Front** : `gen:api`, endpoints/hooks, filtre type de produit, colonnes
   buzz/trend score, section « Analyse » et types de produits dans la fiche,
   calculatrice de simulation.
7. **Docs** : ADR 0008 mis à jour, ADR 0014 (insight) proposé, README fixtures.

## Ordre

Ports → clients → services → schémas/endpoints → tests back → `export_openapi`
→ `gen:api` → front → lint/format/tests.
