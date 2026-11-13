# 0015. Lancer l'API Data/IA dans Compose, depuis son image GHCR

- Statut : acceptée
- Date : 2026-11-13
- Décideurs : Arnaud Fischer

## Contexte

L'API Data/IA (FlavorTrends, dépôt [Matcha-Data](https://github.com/Hetic-Hackathon-Givaudan-2026-Fischer/Matcha-Data)) était exposée par un tunnel ngrok ([ADR 0008](0008-source-tendances-repli.md)) : URL qui change à chaque relance, tunnel qui tombe, données réelles seulement quand l'équipe Data/IA est en ligne. On veut toute la stack, Data/IA comprise, en un seul `docker compose up --build`.

## Options

1. Garder ngrok : rien à faire, mais dépend d'un poste de l'équipe Data/IA.
2. Construire l'image depuis le dépôt git (`build: <url git>`) : pas de registre, mais chaque poste reconstruit l'image (scikit-learn, pandas) et `--build` la reconstruit à chaque lancement.
3. Chemin relatif `../Matcha-Data` ou `include:` : impose de cloner les deux dépôts côte à côte.
4. Image publiée sur GHCR par la CI de Matcha-Data, tirée par Compose : rien à cloner ni à construire côté app ; l'image testée en CI est celle qui tourne.

## Décision

Option 4.

- Matcha-Data publie `ghcr.io/hetic-hackathon-givaudan-2026-fischer/matcha-data` (amd64 et arm64) à chaque push sur `main` (`:latest`, `:sha-<commit>`) et à chaque tag `v*`.
- Le service `data` de [`compose.yml`](../../compose.yml) tire `:latest` avec `pull_policy: always`, port `127.0.0.1:8000`.
- `api` attend que `data` soit sain ; `DATA_AI_URL=http://data:8000` par défaut (`api/.env.example`).
- Le repli CSV de l'ADR 0008 reste en place si `data` tombe ou si `DATA_AI_URL` pointe ailleurs.

## Conséquences

- Positives : stack complète en une commande, sans dépendre d'un tunnel ; mêmes données pour toute l'équipe ; retour en arrière possible par un tag `sha-…`.
- Négatives, à accepter : `docker compose up` interroge GHCR à chaque lancement (hors ligne : `--pull never`) ; les données servies sont celles de `data/sample` au moment du build de l'image ; les explications IA demandent un Ollama sur la machine hôte.
- À revoir si : le package GHCR devient privé (`docker login ghcr.io` pour chaque poste) ; l'API Data/IA a besoin d'une base ou de secrets à l'exécution.
