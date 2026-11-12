# Réponses réelles de l'API Data/IA « FlavorTrends »

Enregistrées le 2026-11-12 sur la v1.2.0 de l'API
([Swagger](../../../../docs/data/swagger-data/openapi.json)) : elles servent de
contrat aux tests de [`app/clients/data_trends.py`](../../../app/clients/data_trends.py).

| Fichier              | Route Data/IA                        | Retouche                        |
| -------------------- | ------------------------------------ | ------------------------------- |
| `health.json`        | `GET /api/v1/health`                 | aucune                          |
| `trends.json`        | `GET /api/v1/trends`                 | 5 arômes sur 102, un par statut |
| `trend_curry.json`   | `GET /api/v1/trends/curry`           | aucune                          |
| `model_metrics.json` | `GET /api/v1/model-metrics`          | aucune                          |
| `ai_indicators.json` | `GET /api/v1/ai/indicators`          | les 5 arômes de `trends.json`   |
| `simulate.json`      | `POST /api/v1/simulate` (corps `{}`) | aucune                          |

Si l'équipe Data/IA change son format : réenregistrer ces fichiers, puis adapter
`data_trends.py` (et lui seul) jusqu'à ce que les tests passent.
