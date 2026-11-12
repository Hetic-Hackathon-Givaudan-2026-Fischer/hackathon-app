# 0008. Servir les tendances depuis l'API Data/IA, avec le CSV en repli

- Statut : proposée
- Date : 2026-11-12
- Décideurs : Arnaud Fischer

## Contexte

Le dashboard et le rapport d'analyse lisent les tendances d'arômes de l'API Data/IA « FlavorTrends », exposée par un tunnel ngrok qui peut tomber. Son contrat : [`openapi.json`](../data/swagger-data/openapi.json) (v1.2.0, schémas de réponse). Un CSV de 102 arômes ([`aromes_indicateurs.csv`](../../api/app/data/aromes_indicateurs.csv)) contient les indicateurs bruts, sans statut ni prédiction.

## Options

1. API Data/IA seule : rien ne marche quand le tunnel est coupé.
2. CSV seul : pas de statut, pas de modèle.
3. API Data/IA en principal, CSV en repli, origine affichée dans chaque réponse.

## Décision

Option 3.

| Élément                                                          | Rôle                                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [`services/ports.py`](../../api/app/services/ports.py)           | `TrendSource`, `ModelMetricsSource`, `DataStatusSource` et leurs données                    |
| [`clients/data_trends.py`](../../api/app/clients/data_trends.py) | `DataTeamTrendSource`, `DataTeamSimulator` : **seul** endroit qui connaît le format Data/IA |
| [`clients/csv_trends.py`](../../api/app/clients/csv_trends.py)   | `CsvTrendSource` : CSV lu une fois, gardé en mémoire                                        |
| [`clients/fallback.py`](../../api/app/clients/fallback.py)       | `FallbackTrendSource(primary, fallback)` : la bascule                                       |
| [`core/indicators.py`](../../api/app/core/indicators.py)         | Indicateur → source d'origine : seule source de vérité                                      |
| [`tests/fixtures/data_ai/`](../../api/tests/fixtures/data_ai/)   | Réponses Data/IA de référence, contrat des tests du client                                  |
| [`api/deps.py`](../../api/app/api/deps.py)                       | `DATA_AI_URL` vide → CSV seul ; sinon Data/IA + repli CSV                                   |

Règles :

- Basculer sur le CSV si : connexion refusée, timeout (`DATA_AI_TIMEOUT_SECONDS`), `5xx`, `401`/`403`, JSON illisible ou format inattendu.
- Un `404` JSON de Data/IA sur une fiche reste un `404`. Un `404` HTML (tunnel ngrok hors ligne) déclenche le repli.
- Logger chaque bascule en `warning` avec sa cause, jamais la clé d'API.
- Chaque réponse porte `origin` (`data_ai` | `csv_fallback`) et `data_date`.
- Indicateurs : catalogue commun dans `core/indicators.py`. Clé absente = non fourni par la source, `None` = fourni mais vide. Qualité et KPI ne portent que sur les indicateurs fournis.
- En repli : `status`, `score` et `analysis` à `null`, `product_types` vide, aucun modèle appliqué ; `GET /report/model` répond `200` avec `available: false` ; `POST /simulate` répond `503`.
- Indicateurs métier (`GET /ai/indicators` → `analysis`) : lus avec les arômes ; leur panne laisse `analysis` à `null` **sans** basculer sur le CSV.
- Types de produits : `GET /product-types` se calcule dans `TrendService` depuis les arômes, jamais via la route Data/IA du même nom.
- `POST /simulate` relaie `POST /simulate` de Data/IA : calcul sans état, rien n'est écrit chez Data/IA (compatible avec l'[ADR 0011](0011-retrait-questions-ia.md)).
- `GET /trends/{id}/insight` (texte rédigé par un LLM) : non relayé, voir l'[ADR 0014](0014-insight-ia-generative.md).
- Filtres, tri, pagination et KPI se calculent dans les services, jamais chez la source : mêmes résultats quelle que soit l'origine.
- Codes HTTP, en plus de l'[ADR 0004](0004-backend-fastapi.md) : `404` ressource inconnue, `410` lien showroom expiré ou révoqué ([0010](0010-liens-showroom.md)), `500` générique pour toute erreur non prévue (détail dans les logs).
- `GET /api/v1/health` donne l'état Data/IA (`up` | `down` | `non_configuree`) sans passer l'API en « unhealthy ».

## Conséquences

- Positives : le dashboard et le rapport marchent sans le tunnel ; un changement de format Data/IA ne touche qu'un fichier.
- Négatives, à accepter : quand le tunnel pend, chaque requête attend le timeout avant le repli ; `list_trends` fait deux appels Data/IA en parallèle (`/trends` et `/ai/indicators`).
- À revoir si : l'équipe Data/IA change de format (nouvelle version du Swagger : réenregistrer les fixtures) ; le délai de bascule gêne (ajouter un disjoncteur).
