# 0003. Tester l'API avec Vitest et lancer les tests en CI

- Statut : proposée
- Date : 2026-11-08
- Décideurs : Arnaud Fischer

## Contexte

Le projet n'a aucun test. La CI (`.github/workflows/ci.yml`) vérifie le lint, le format et la compilation, pas le comportement. Le modèle de pull request demande pourtant « Tests unitaires / intégration passés ». Pendant deux semaines, plusieurs personnes modifient l'API en même temps : une régression (route cassée, requête SQL fausse) ne doit pas arriver sur `develop`. L'API dépend de PostgreSQL et d'une IA (Ollama ou API Data/IA) qui n'est pas disponible en CI.

La stack actuelle (Node, Express, TypeScript) n'est pas encore définitive : l'équipe doit d'abord valider l'idée du projet, puis faire ses choix technologiques. Ce choix d'outil de test dépend donc de la stack retenue.

## Options

1. Vitest : TypeScript et ESM sans configuration, même écosystème que Vite côté front. Une dépendance de plus.
2. Jest : le plus connu. TypeScript et ESM demandent de la configuration (`ts-jest`, options expérimentales de Node).
3. `node:test` : intégré à Node 24, aucune dépendance. Simulations et mode watch moins confortables.
4. Pas de tests automatisés, seulement de la relecture et des essais à la main : rien à mettre en place. Aucune protection contre les régressions.

## Décision

Nous proposons l'option 1, sur trois niveaux, par ordre de priorité :

1. Tests unitaires du backend : la logique sans base ni réseau (validation de la question, lecture de la réponse de l'IA), avec l'IA simulée.
2. Tests d'intégration du backend : les routes appelées avec Supertest, sur une vraie base PostgreSQL 17 dédiée aux tests (même image que `compose.yml`, schéma de `db/init/`), avec l'IA toujours simulée.
3. Tests end-to-end, si le temps le permet : Playwright sur le parcours « poser une question, voir la réponse ».

Un job `tests` est ajouté à la CI et tourne sur chaque pull request, avec un service PostgreSQL. Une pull request dont les tests échouent ne peut pas être fusionnée.

## Conséquences

- Positives : une régression de l'API est détectée dans la pull request, avant `develop` ; la case « tests passés » du modèle de PR devient vérifiable.
- Négatives, à accepter :
  - `api/src/index.ts` doit être découpé : exporter `app` sans `app.listen()`, et sortir les appels à l'IA dans un module pour pouvoir les simuler (ce qui sert aussi [0001](0001-client-ia.md)) ;
  - un nouveau job dans `.github/workflows/ci.yml` (service PostgreSQL, `npm test`), donc une CI plus longue ;
  - une règle de protection sur `develop` pour que ce job bloque la fusion ;
  - du temps de hackathon pris sur les fonctionnalités.
- À revoir si : l'équipe change de technologie après avoir validé l'idée, par exemple un backend en Python avec Flask ou FastAPI (Vitest et Supertest seraient alors remplacés, par exemple par pytest ; les trois niveaux de tests, la base PostgreSQL dédiée, l'IA simulée et le job de CI restent valables) ; les tests end-to-end sont trop lents ou instables en CI (les lancer seulement avant la démo) ; le temps manque (garder au minimum les tests d'intégration des routes).
