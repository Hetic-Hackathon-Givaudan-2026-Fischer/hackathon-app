# 0013. Déployer front et API sur Vercel, en services

- Statut : acceptée
- Date : 2026-11-12
- Décideurs : Arnaud Fischer

## Contexte

Il faut une URL publique pour la démo et les liens showroom ([0010](0010-liens-showroom.md)). Compose ([0002](0002-docker-compose.md)) ne sert qu'au dev. Vercel accepte plusieurs services (Vite + FastAPI) dans un seul projet, derrière un seul domaine. Il n'héberge pas PostgreSQL.

## Options

1. Image `prod` d'[`api/Dockerfile`](../../api/Dockerfile) sur un hébergeur de conteneurs + front statique : deux déploiements, CORS ou proxy à gérer.
2. Vercel en services : un domaine, `/api` routé vers FastAPI, aucun changement de chemin ; base PostgreSQL externe.

## Décision

Option 2, dans [`vercel.json`](../../vercel.json) :

| Service | Racine | Public sur | Rôle                                                          |
| ------- | ------ | ---------- | ------------------------------------------------------------- |
| `api`   | `api/` | `/api/*`   | FastAPI (`app/main.py`, `app`), chemin reçu tel quel.         |
| `web`   | `web/` | `/*`       | Build Vite statique ; repli sur `index.html` (`/showroom/…`). |

Variables à définir dans Vercel (jamais dans le dépôt) : `DATABASE_URL`, `PUBLIC_WEB_URL` (domaine Vercel), `DATA_AI_URL`, `DATA_AI_KEY`.

Règles :

- Toujours garder les routes de l'API sous `/api` : Vercel ne retire pas le préfixe.
- Aucun binding : le front appelle l'API depuis le navigateur, en même origine (`/api/v1/...`).
- Jamais de secret dans `vercel.json` ni `.vercelignore`.
- Schéma de la base : jouer `db/init/*.sql` à la main sur la base hébergée.
- `vite.config.ts` (proxy, `API_URL`) reste un outil de dev, sans effet sur Vercel.

## Conséquences

- Positives : un seul domaine, pas de CORS ; code de l'API et du front inchangé.
- Négatives, à accepter : dashboard interne et Swagger publics ; base externe à choisir et à initialiser ; fonctions Python à démarrage à froid.
- À revoir si : le dashboard doit être protégé (Vercel Authentication, ou auth applicative) ; la base passe par un pooler (pgbouncer : cache de requêtes préparées d'asyncpg à couper).
