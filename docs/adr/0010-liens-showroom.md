# 0010. Ouvrir le showroom aux clients par un lien temporaire

- Statut : acceptée
- Date : 2026-11-12
- Décideurs : Arnaud Fischer

## Contexte

Givaudan veut montrer la vue immersive à ses clients, sans leur créer de compte. Le lien ne doit donner accès ni au dashboard, ni au rapport d'analyse.

## Options

1. Comptes clients : hors périmètre (pas de login).
2. JWT signé : pas de révocation sans liste noire.
3. Jeton opaque aléatoire, stocké haché en base : révocable, sans dépendance.

## Décision

Option 3.

| Élément                                                                      | Rôle                                                   |
| ---------------------------------------------------------------------------- | ------------------------------------------------------ |
| [`db/init/004-showroom.sql`](../../db/init/004-showroom.sql)                 | Table `showroom_links`                                 |
| [`services/showroom.py`](../../api/app/services/showroom.py)                 | Créer, lister, révoquer, résoudre un lien              |
| [`clients/tokens.py`](../../api/app/clients/tokens.py)                       | `secrets.token_urlsafe(32)` derrière `TokenGenerator`  |
| [`api/v1/endpoints/showroom.py`](../../api/app/api/v1/endpoints/showroom.py) | Gestion `/showroom/links`, lecture `/showroom/{token}` |

Règles :

- Jeton de 32 octets aléatoires, stocké en SHA-256, montré **une seule fois** à la création.
- Durée de vie : `SHOWROOM_LINK_TTL_HOURS` par défaut (72 h), 720 h maximum. Révocation : `revoked_at`, jamais de suppression.
- Jeton inconnu → `404` ; expiré ou révoqué → `410`.
- Périmètre : une liste de familles d'arômes (vide = toutes). `GET /showroom/{token}` ne renvoie que les arômes de ce périmètre, en lecture seule.
- URL du lien : `PUBLIC_WEB_URL` + `/showroom/{jeton}`.
- Jamais de jeton dans les logs : le chemin `/showroom/{jeton}` est masqué dans les logs d'accès.
- Avant toute exposition hors `localhost` : protéger les routes de gestion (au minimum `SHOWROOM_ADMIN_KEY` dans `api/.env`).

## Conséquences

- Positives : aucun compte client ; lien révocable à tout moment ; une fuite de la base ne livre pas de jeton utilisable.
- Négatives, à accepter : les routes de gestion sont ouvertes tant que l'API reste locale ; un jeton perdu ne se retrouve pas (on en crée un autre).
- À revoir si : l'API est exposée publiquement ; un login interne arrive ; un client veut plusieurs utilisateurs.
