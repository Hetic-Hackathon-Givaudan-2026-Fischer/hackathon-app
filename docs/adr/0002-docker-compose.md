# 0002. Lancer la stack avec Docker Compose, le dev container en option

- Statut : acceptée
- Date : 2026-11-08 (mise à jour le 2026-11-10 : API en Python, voir [0004](0004-backend-fastapi.md))
- Décideurs : Arnaud Fischer

## Contexte

Équipe inconnue au départ (OS, versions, éditeur). Beaucoup d'éditeurs récents ne gèrent pas les dev containers. Il faut lancer la stack en une commande et voir ses modifications sans redémarrer.

## Options

1. Tout installer sur sa machine : versions différentes d'un poste à l'autre.
2. Dev container obligatoire : impose VS Code ou Zed.
3. Docker Compose comme socle, dev container en option : mêmes versions, éditeur au choix.

## Décision

Option 3.

| Fichier                                  | Rôle                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [`compose.yml`](../../compose.yml)       | `db` (PostgreSQL 17), `install` (`npm ci`, `api/.env`), `api` (FastAPI), `web` (Vite), `dev`.    |
| [`api/Dockerfile`](../../api/Dockerfile) | Image de l'API, venv dans `/opt/venv` ; cible `dev` (Compose, `uvicorn --reload`) et `prod`.     |
| [`setup.sh`](../../setup.sh)             | Vérifie Docker, `DATA_AI_URL`, ports ; démarre la stack jusqu'à ce que tout soit sain.           |
| [`.devcontainer/`](../../.devcontainer/) | Option VS Code / Zed sur le service `dev` : Node 24, Python 3.13, uv, git, `psql`, ESLint, ruff. |

Règles :

- Le projet est monté dans les conteneurs (`.:/workspace`) : pas de redémarrage pour du code.
- Ports publiés sur `127.0.0.1` uniquement.
- Jamais de socket Docker dans `dev` (accès root à la machine).
- Ordre de démarrage par healthchecks : `db` → `api` → `web`.

| Après modification de | Lancer (sur la machine)            |
| --------------------- | ---------------------------------- |
| `api/.env`            | `docker compose restart api`       |
| `api/Dockerfile`      | `docker compose up -d --build api` |
| `.devcontainer/`      | recréer le dev container           |

## Conséquences

- Positives : éditeur au choix ; Docker seul prérequis ; Node 24, Python 3.13, PostgreSQL 17 partout.
- Négatives : deux terminaux (machine : `docker compose`, `setup.sh` ; `dev` : `npm`, `uv`, `git`, `psql`) ; sans dev container, le hook pre-commit demande Node et uv sur la machine.
- À revoir si : toute l'équipe est sur VS Code ou Zed ; modifications non détectées via le montage (Windows hors WSL : polling pour uvicorn et Vite) ; déploiement (front et config à faire).
