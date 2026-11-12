# 0014. Relayer l'explication rédigée par l'IA Data/IA (insight)

- Statut : proposée
- Date : 2026-11-12
- Décideurs : Arnaud Fischer

## Contexte

Le Swagger Data/IA 1.2.0 ajoute `GET /api/v1/trends/{trend_id}/insight` : une explication métier d'un arôme (résumé, moteurs, opportunité, recommandation), rédigée par un LLM local (Ollama) chez Data/IA. Chiffres et statut sont calculés en Python ; seul le texte vient du LLM. Première génération : 20 à 60 s, puis cache. Ollama coupé : texte modèle (`generated_by: fallback`). L'[ADR 0011](0011-retrait-questions-ia.md) impose un nouvel ADR pour toute fonction d'IA générative.

## Options

1. Ne pas relayer : aucune explication rédigée dans la fiche.
2. Relayer en lecture, sans LLM chez nous : `GET /api/v1/trends/{id}/insight`, `use_llm` et `focus` transmis, `generated_by` affiché.
3. Relayer en forçant `use_llm=false` : texte modèle immédiat, jamais de LLM.

## Décision

À décider. Option 2 recommandée, avec ces règles :

- Le format n'est connu que de [`clients/data_trends.py`](../../api/app/clients/data_trends.py) ; un port `InsightSource` dans `services/ports.py`.
- Délai propre à cette route (60 s), jamais le `DATA_AI_TIMEOUT_SECONDS` des tendances.
- En repli CSV ou Data/IA coupée : `503`, aucun texte généré chez nous.
- Le front affiche toujours `generated_by` (« rédigé par une IA » / « texte modèle ») et `data_limitations`.

## Conséquences

- Positives : fiche plus lisible pour les équipes métier ; aucun LLM à installer chez nous.
- Négatives, à accepter : texte non déterministe ; première réponse lente ; dépend du tunnel ngrok.
- À revoir si : Data/IA retire Ollama ou change le format de `Insight`.
