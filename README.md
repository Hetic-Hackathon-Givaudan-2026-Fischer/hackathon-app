# hackathon-app

Application du hackathon Givaudan : les **tendances d'arômes** de l'équipe Data/IA, présentées dans un magasin 3D, un dashboard interne et un showroom pour les clients.

- **En dev** : tout tourne dans Docker (front, API, base). Rien d'autre à installer que Docker et Git.
- **En démo** : front et API sont déployés sur Vercel, derrière un seul domaine.

## Démarrage rapide

Depuis un terminal **de ta machine** (pas du dev container) :

```bash
git clone https://github.com/Hetic-Hackathon-Givaudan-2026-Fischer/hackathon-app.git
cd hackathon-app
```

Puis, au choix :

| Option                      | Commande                    | Pour qui                                                                   |
| --------------------------- | --------------------------- | -------------------------------------------------------------------------- |
| **A. Script** (recommandée) | `./setup.sh`                | Premier lancement : vérifie Docker, les ports et `api/.env`, puis démarre. |
| **B. Docker Compose seul**  | `docker compose up --build` | Tu connais Docker : démarre tout, logs dans le terminal, `Ctrl+C` arrête.  |

Puis ouvre http://localhost:5173. Le premier lancement prend quelques minutes (images Docker, dépendances).

Sans `DATA_AI_URL` dans `api/.env`, l'app tourne quand même, avec des données de repli (voir [section 6](#6-données-dataia-et-csv-de-repli)).

**Sommaire**

1. [Ce que fait l'application](#1-ce-que-fait-lapplication)
2. [Installation](#2-installation)
3. [Hôte ou dev container : où lancer quoi](#3-hôte-ou-dev-container--où-lancer-quoi)
4. [Coder dans le dev container](#4-coder-dans-le-dev-container)
5. [Architecture](#5-architecture)
6. [Données Data/IA et CSV de repli](#6-données-dataia-et-csv-de-repli)
7. [Déploiement sur Vercel](#7-déploiement-sur-vercel)
8. [Tâches courantes](#8-tâches-courantes)
9. [Qualité du code et CI](#9-qualité-du-code-et-ci)
10. [Dépannage](#10-dépannage)
11. [Sécurité](#11-sécurité)

---

## 1. Ce que fait l'application

Trois vues, une seule app React :

| Vue            | URL                 | Pour qui         | Ce qu'on y fait                                                                                                             |
| -------------- | ------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Magasin 3D** | `/` (à l'arrivée)   | Équipes Givaudan | Parcourir les rayons, scanner un produit pour voir ses familles d'arômes. **Tab** ouvre le dashboard.                       |
| **Dashboard**  | `/` (touche Tab)    | Équipes Givaudan | KPI, liste des arômes (filtres, tri), fiche d'un arôme (séries, signaux, analyse), simulation, signalement, liens showroom. |
| **Showroom**   | `/showroom/{jeton}` | Clients          | Vue client seule, ouverte par un lien à durée limitée et révocable ([ADR 0010](docs/adr/0010-liens-showroom.md)).           |

Toutes les données passent par notre API (`/api/v1/...`), documentée dans le Swagger : http://localhost:3000/api/docs.

| Domaine    | Routes                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------ |
| Santé      | `GET /health`                                                                              |
| Dashboard  | `GET /dashboard/summary`, `GET /families`, `GET /product-types`                            |
| Tendances  | `GET /trends`, `GET /trends/{trend_id}`                                                    |
| Rapport    | `GET /report`, `GET /report/trends/{trend_id}`, `GET /report/model`, `POST /report/issues` |
| Simulation | `POST /simulate`                                                                           |
| Showroom   | `POST/GET /showroom/links`, `DELETE /showroom/links/{link_id}`, `GET /showroom/{token}`    |

---

## 2. Installation

### Prérequis

| Outil                                                           | Obligatoire ?                         | Vérifier avec            |
| --------------------------------------------------------------- | ------------------------------------- | ------------------------ |
| [Docker](https://docs.docker.com/get-docker/) + Compose v2      | Oui                                   | `docker compose version` |
| Git                                                             | Oui                                   | `git --version`          |
| VS Code (extension _Dev Containers_) ou [Zed](https://zed.dev/) | Non, seulement pour coder dans Docker |                          |

**Ni Node ni Python** ne sont nécessaires sur ta machine : tout tourne dans les conteneurs.

Deux façons de démarrer, au choix. Les deux construisent les images et créent `api/.env` à partir de `api/.env.example` s'il manque.

### Option A (recommandée) : `setup.sh`

```bash
./setup.sh
```

Le script est **relançable sans risque** : ce qui est déjà fait est sauté. Sous Windows, lance-le depuis **Git Bash** ou **WSL**.

| Étape         | Ce que fait le script                                                               |
| ------------- | ----------------------------------------------------------------------------------- |
| Hôte          | Refuse de tourner dans un conteneur : il faut le lancer depuis ta machine.          |
| Docker        | Vérifie que Docker est installé, que le démon répond et que Compose v2 est présent. |
| Configuration | Crée `api/.env` à partir de `api/.env.example` s'il n'existe pas.                   |
| Données       | Indique si `DATA_AI_URL` est renseignée (sinon : CSV de repli, sans modèle).        |
| Ports         | Vérifie que 3000, 5173 et 5433 sont libres (sauf si la stack tourne déjà).          |
| Démarrage     | `docker compose up -d --build --wait api web`, puis attend que tout soit sain.      |

La stack tourne en arrière-plan ; le terminal est rendu une fois tout sain.

### Option B : `docker compose up --build`

```bash
docker compose up --build
```

Aucune vérification préalable : Compose construit les images, crée `api/.env` (service `install`) et démarre **tous** les services, y compris `dev` (le poste de travail du dev container). Les logs défilent dans le terminal ; `Ctrl+C` arrête tout.

| Variante                              | Commande                                      |
| ------------------------------------- | --------------------------------------------- |
| En arrière-plan                       | `docker compose up -d --build`                |
| Sans `dev`, comme `setup.sh`          | `docker compose up -d --build --wait api web` |
| Vérifier : api, web et db « healthy » | `docker compose ps`                           |

### Ce qui tourne une fois lancé

| Adresse                             | Quoi                                              |
| ----------------------------------- | ------------------------------------------------- |
| http://localhost:5173               | Le front                                          |
| http://localhost:3000/api/docs      | Swagger : toutes les routes, testables en un clic |
| http://localhost:3000/api/v1/health | Santé de l'API, de la base et de l'API Data/IA    |
| http://localhost:5173/api/...       | La même API, à travers le proxy du front          |
| `localhost:5433` (user / mdp `app`) | PostgreSQL, pour TablePlus, DBeaver, `psql`…      |

---

## 3. Hôte ou dev container : où lancer quoi

Le projet a **deux terminaux**, qui ne servent pas à la même chose :

| Terminal                                       | Sert à                  | Commandes                                                  |
| ---------------------------------------------- | ----------------------- | ---------------------------------------------------------- |
| **Ta machine** (l'hôte)                        | Piloter Docker          | `./setup.sh`, `docker compose …`, `vercel …`               |
| **Dev container** (invite `node@…:/workspace`) | Coder, tester, commiter | `npm run …`, `uv run …` (dans `api/`), `git`, `gh`, `psql` |

Le dev container n'a **pas** accès à Docker, volontairement : ce serait un accès root à ta machine. Pour savoir où tu es :

```bash
whoami   # « node » dans le dev container
pwd      # « /workspace » dans le dev container
```

---

## 4. Coder dans le dev container

Optionnel, mais recommandé : l'éditeur s'attache au conteneur `dev`, avec Node 24, Python 3.13, uv, git, `psql`, ESLint, Prettier et ruff déjà configurés. Il démarre la stack tout seul si besoin.

À la création, le conteneur installe les dépendances Python dans `api/.venv` (`uv sync`) et active le hook pre-commit. `pyrightconfig.json` indique ce venv à l'éditeur (Pylance, basedpyright) : sans lui, les imports de FastAPI apparaissent en erreur.

<details>
<summary><b>VS Code</b></summary>

<br>

1. Ouvre le dossier `hackathon-app`.
2. Palette (`Ctrl+Shift+P`) → _Dev Containers: Reopen in Container_.

</details>

<details>
<summary><b>Zed</b></summary>

<br>

1. Ouvre **le dossier `hackathon-app` lui-même**, pas son parent : Zed ne cherche `.devcontainer/` qu'à la racine du projet ouvert.
   ```bash
   zed chemin/vers/hackathon-app
   ```
2. Clique sur la notification _Open in Container_, ou palette (`Ctrl+Shift+P`) → _Open Dev Container_.

C'est bon quand **Hackathon** s'affiche en haut à gauche et que la racine du projet s'appelle **workspace**.

Après une modification de `.devcontainer/`, Zed ne reconstruit pas tout seul : `docker compose down` depuis ta machine, puis rouvre dans le conteneur.

</details>

<details>
<summary><b>Sans éditeur, dans un terminal</b></summary>

<br>

```bash
docker compose up -d dev
docker compose exec dev bash
```

</details>

<details>
<summary><b>Avec un agent IA (Claude Code, Codex…)</b></summary>

<br>

`AGENTS.md` donne aux agents les règles du dépôt (Claude Code le lit via `CLAUDE.md`). Pour le code FastAPI, il les renvoie au **skill officiel de FastAPI**, dans `.agents/skills/fastapi/` (`SKILL.md` pour les conventions, `references/` pour le détail).

| Agent       | Comment l'utiliser                                                                     |
| ----------- | -------------------------------------------------------------------------------------- |
| Codex       | Il découvre seul `.agents/skills/` ; pour le forcer, écris `$fastapi` dans ta demande. |
| Claude Code | Précise-le dans ta demande : « en suivant `.agents/skills/fastapi` ».                  |
| Humain      | Le skill se lit comme une doc : commence par la _Quick Reference_ de `SKILL.md`.       |

**Les ADR l'emportent sur le skill.** Là où le skill contredit un ADR « acceptée », l'ADR gagne :

| Le skill conseille                      | Ce dépôt fait                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| SQLModel                                | SQLAlchemy async + asyncpg ([ADR 0004](docs/adr/0004-backend-fastapi.md)).     |
| Lancer l'API avec `fastapi dev`         | `uvicorn --reload`, lancé par `docker compose` (`api/Dockerfile`).             |
| Ajouter une bibliothèque (Asyncer, ty…) | Lire d'abord `docs/adr/` ; un changement de composant passe par un nouvel ADR. |

</details>

---

## 5. Architecture

```
 navigateur ──► web (Vite, :5173) ──/api──► api (FastAPI, :3000) ──► db (PostgreSQL, :5433)
                                                 │
                                                 ├──► API de l'équipe Data/IA (ngrok)  si DATA_AI_URL est renseignée
                                                 └──► CSV de repli                     si DATA_AI_URL est vide, ou Data/IA coupée
```

### Le dépôt

| Dossier / fichier         | Contenu                                                                           |
| ------------------------- | --------------------------------------------------------------------------------- |
| `web/`                    | Front React + TypeScript + Tailwind (Vite), scène 3D three.js.                    |
| `api/`                    | API FastAPI + Python 3.13 (uv).                                                   |
| `db/init/`                | Schéma de la base, joué **au premier démarrage seulement**.                       |
| `openapi.yaml`            | Contrat de notre API, généré depuis FastAPI ; les types du front en sont générés. |
| `docs/data/swagger-data/` | Contrat de l'API Data/IA (`openapi.json`, v1.2.0).                                |
| `docs/adr/`               | Les décisions d'architecture (ADR) : **à lire avant de changer un composant**.    |
| `vercel.json`             | Déploiement Vercel ([section 7](#7-déploiement-sur-vercel)).                      |
| `.devcontainer/`          | Le conteneur `dev`.                                                               |
| `.github/workflows/`      | La CI ([section 9](#9-qualité-du-code-et-ci)).                                    |
| `AGENTS.md`, `.agents/`   | Consignes et skills des agents IA.                                                |

### L'API (`api/app/`)

```
api/app/
├── main.py              # crée l'app : connexions, routeur, gestion des erreurs
├── core/config.py       # configuration, lue dans api/.env
├── db/                  # connexion à PostgreSQL
├── models/              # les tables (SQLAlchemy)
├── schemas/             # les entrées et sorties de l'API (Pydantic)
├── repositories/        # les requêtes SQL
├── clients/             # API Data/IA, CSV de repli, bascule entre les deux
├── services/            # la logique métier ; ports.py = les interfaces (Protocol)
└── api/
    ├── deps.py          # l'injection : le SEUL endroit qui choisit les implémentations
    └── v1/
        ├── router.py    # regroupe les endpoints de la v1
        └── endpoints/   # health, dashboard, trends, report, showroom, simulation
```

Règles ([ADR 0004](docs/adr/0004-backend-fastapi.md)) :

- **Endpoint mince** : il reçoit un schéma, appelle un service, renvoie un schéma. Jamais de SQL ni de logique métier dedans.
- **Logique métier** dans `services/`, **requêtes SQL** dans `repositories/`.
- **Tout accès externe** (base, Data/IA) passe par `api/deps.py` : en test, on le remplace sans toucher au code.
- **Nouvelle version d'API** : à côté (`api/v2/`), sans casser la v1.

### Le front (`web/src/`)

| Dossier       | Contenu                                                                          |
| ------------- | -------------------------------------------------------------------------------- |
| `components/` | Composants React (dashboard, immersive, showroom) ; jamais d'import de `three`.  |
| `engine/`     | Moteur three.js du magasin 3D ; entrée unique `createExperience`.                |
| `hooks/`      | Le pont React ↔ moteur (`useExperience`) et les appels à l'API.                  |
| `api/`        | Seul accès réseau : client `openapi-fetch`, types générés depuis `openapi.yaml`. |
| `immersive/`  | Lien entre un rayon 3D et les familles d'arômes, fiche affichée au scan.         |
| `lib/`        | Mise en forme partagée (nombres, dates, familles, origine des données).          |

Le pourquoi : [ADR 0007](docs/adr/0007-front-react.md) (React + three.js) et [ADR 0012](docs/adr/0012-types-front-openapi.md) (types générés).

### Les tests (`api/tests/`)

| Niveau         | Teste               | Avec                                                          |
| -------------- | ------------------- | ------------------------------------------------------------- |
| `unit/`        | Services et clients | Des faux (`tests/fakes.py`)                                   |
| `api/`         | Les routes          | Dépendances remplacées (`app.dependency_overrides`)           |
| `integration/` | Les repositories    | Un vrai PostgreSQL ; sautés si `TEST_DATABASE_URL` est absent |

L'API Data/IA n'est jamais appelée en test : ses réponses sont enregistrées dans `tests/fixtures/data_ai/`.

---

## 6. Données Data/IA et CSV de repli

L'API lit les tendances d'arômes chez l'équipe Data/IA. Quand elle ne répond pas, elle **bascule automatiquement** sur un CSV ([ADR 0008](docs/adr/0008-source-tendances-repli.md)).

| `DATA_AI_URL` dans `api/.env` | Données servies                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| Renseignée                    | API Data/IA (statuts, scores, séries). Si elle est coupée (timeout, `5xx`…) : CSV. |
| Vide                          | CSV de repli (`api/app/data/`) : indicateurs bruts, sans modèle.                   |

**Comment savoir d'où viennent les données ?**

- Chaque réponse porte `origin` (`data_ai` ou `csv_fallback`) et `data_date`.
- `GET /api/v1/health` donne l'état de Data/IA : `up`, `down` ou `non_configuree`.

**Ce qui manque en repli CSV** (le reste se calcule chez nous à l'identique : filtres, tri, pagination, KPI) :

| Donnée / route                | Avec Data/IA                     | En repli CSV              |
| ----------------------------- | -------------------------------- | ------------------------- |
| `status`, `score`, `analysis` | Renseignés                       | `null`                    |
| `product_types` d'un arôme    | Renseignés                       | Vide                      |
| `GET /api/v1/report/model`    | Métriques du modèle              | `200`, `available: false` |
| `POST /api/v1/simulate`       | Probabilité d'une hausse durable | `503`                     |

L'explication rédigée par le LLM de Data/IA (`/trends/{id}/insight`) n'est **pas** relayée ([ADR 0014](docs/adr/0014-insight-ia-generative.md)).

### Quand le tunnel ngrok change d'URL

L'URL change à chaque relance du tunnel par l'équipe Data/IA :

1. Mets la nouvelle URL dans `api/.env` (`DATA_AI_URL`).
2. Depuis ta machine : `docker compose restart api`.

Si l'équipe Data/IA protège son API, mets sa clé dans `DATA_AI_KEY` (envoyée dans l'en-tête `X-API-Key`). Cette clé se transmet **hors de git**.

### Toutes les variables de `api/.env`

| Variable                  | Rôle                                                   | Défaut                  |
| ------------------------- | ------------------------------------------------------ | ----------------------- |
| `DATABASE_URL`            | Connexion PostgreSQL (`postgres://…` suffit).          | La base de Compose      |
| `DATA_AI_URL`             | URL de l'API Data/IA ; vide = CSV seul.                | Vide                    |
| `DATA_AI_KEY`             | Clé de l'API Data/IA, si elle en demande une.          | Vide                    |
| `DATA_AI_TIMEOUT_SECONDS` | Délai au-delà duquel Data/IA est jugée injoignable.    | `5`                     |
| `PUBLIC_WEB_URL`          | URL du front, utilisée dans les liens showroom.        | `http://localhost:5173` |
| `SHOWROOM_LINK_TTL_HOURS` | Durée de vie par défaut d'un lien showroom, en heures. | `72`                    |

---

## 7. Déploiement sur Vercel

Front et API sont **un seul projet Vercel**, en deux services, derrière **un seul domaine** ([ADR 0013](docs/adr/0013-deploiement-vercel.md)) :

| Service | Dossier | Répond sur | Contenu                                                                  |
| ------- | ------- | ---------- | ------------------------------------------------------------------------ |
| `api`   | `api/`  | `/api/*`   | FastAPI. Vercel ne retire pas le préfixe : les routes gardent `/api`.    |
| `web`   | `web/`  | `/*`       | Build Vite statique ; toute autre URL (`/showroom/…`) sert `index.html`. |

Le front appelle l'API sur le même domaine (`/api/v1/...`) : pas de CORS. Le proxy de `vite.config.ts` ne sert qu'en dev.

> ⚠️ Sur Vercel, le dashboard interne et le Swagger sont **publics**. N'y mets pas de données sensibles tant qu'aucune protection (Vercel Authentication, auth applicative) n'est en place.

### Déployer (depuis ta machine, avec la CLI Vercel)

**1. Préparer une base PostgreSQL hébergée.** Vercel n'en fournit pas. Une fois la base créée, joue le schéma à la main :

```bash
for f in db/init/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
```

**2. Définir les variables dans Vercel** (Settings → Environment Variables, ou `vercel env add`). Jamais dans le dépôt, ni dans `vercel.json` :

| Variable         | Valeur                                                                     |
| ---------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`   | L'URL de la base hébergée.                                                 |
| `PUBLIC_WEB_URL` | Le domaine Vercel. Sans elle, les liens showroom pointent sur `localhost`. |
| `DATA_AI_URL`    | L'API Data/IA (vide : CSV seul).                                           |
| `DATA_AI_KEY`    | Sa clé, si besoin.                                                         |

**3. Déployer**

```bash
vercel link            # une seule fois : relie le dossier au projet (crée .vercel/, ignoré par git)
vercel deploy          # déploiement de preview
vercel deploy --prod   # déploiement de production
```

`.vercelignore` exclut de l'envoi `db/data`, les `.env`, `node_modules` et les venv.

---

## 8. Tâches courantes

| Je veux…                                            | Commande                                                 | Où                    |
| --------------------------------------------------- | -------------------------------------------------------- | --------------------- |
| Voir l'état des services                            | `docker compose ps`                                      | Hôte                  |
| Lire les logs de l'API                              | `docker compose logs -f api` (ou `web`, `db`, `install`) | Hôte                  |
| Prendre en compte un changement de `api/.env`       | `docker compose restart api`                             | Hôte                  |
| Prendre en compte un changement de `api/Dockerfile` | `docker compose up -d --build api`                       | Hôte                  |
| Tout arrêter                                        | `docker compose down`                                    | Hôte                  |
| Ouvrir une console SQL                              | `docker compose exec db psql -U app app`                 | Hôte                  |
| Lancer les tests de l'API                           | `uv run pytest`                                          | Dev container, `api/` |

### Ajouter une dépendance Python

Dans le dev container :

```bash
cd api
uv add <paquet>          # ou uv add --dev <paquet> pour un outil de dev
```

Commite `api/pyproject.toml` **et** `api/uv.lock`. Puis, depuis ta machine : `docker compose restart api`. Au redémarrage, l'API installe ce qui manque. Les coéquipiers n'ont qu'à faire `git pull` et ce même redémarrage.

### Après un changement de schéma Pydantic

Les types du front ne s'écrivent **jamais** à la main ([ADR 0012](docs/adr/0012-types-front-openapi.md)). Dans le dev container :

```bash
cd api && uv run python -m app.scripts.export_openapi   # 1. régénère openapi.yaml
cd .. && npm run gen:api                                # 2. régénère web/src/api/schema.d.ts
```

Commite les deux fichiers : la CI échoue s'ils ne correspondent plus au code.

### Réinitialiser la base

`db/init/*.sql` n'est joué qu'au **premier** démarrage de la base. Pour tout rejouer (⚠️ efface les données), depuis ta machine :

```bash
docker compose down
rm -rf db/data
./setup.sh                  # ou : docker compose up --build
```

Les données vivent dans le dossier `db/data/`, pas dans un volume : `docker compose down -v` ne les efface **pas**.

Pour jouer un seul nouveau fichier sans rien perdre :

```bash
docker compose exec -T db psql -U app -d app -v ON_ERROR_STOP=1 < db/init/004-showroom.sql
```

---

## 9. Qualité du code et CI

| Outil        | Rôle                                                                       |
| ------------ | -------------------------------------------------------------------------- |
| **ESLint**   | Front : erreurs probables (variable inutilisée, promesse oubliée, `any`…). |
| **Prettier** | Front et docs : la forme (guillemets, indentation, retours à la ligne).    |
| **ruff**     | API : lint et formatage du Python.                                         |
| **pytest**   | API : tests des services, des routes et des repositories.                  |
| **husky**    | À chaque commit : ESLint, Prettier et ruff sur les fichiers indexés.       |

Dans VS Code et Zed, le dev container formate à l'enregistrement.

### Avant d'ouvrir une pull request

Dans le dev container, ces commandes doivent toutes passer :

```bash
# À la racine
npm run lint           # ESLint
npm run format:check   # Prettier, sans modifier (npm run format pour corriger)

# Dans api/
uv run ruff check      # lint (--fix pour corriger)
uv run ruff format     # formatage
uv run pytest          # tests
```

### Ce que vérifie la CI

À chaque pull request, et à chaque push sur `main` ou `develop` :

| Workflow       | Vérifie                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------- |
| `ci.yml`       | Front : ESLint, Prettier, types à jour, build. API : ruff, `openapi.yaml` à jour.           |
| `tests.yml`    | `uv run pytest`.                                                                            |
| `security.yml` | Scans de sécurité, dont l'image `prod` de l'API ([ADR 0005](docs/adr/0005-ci-securite.md)). |

Une règle ESLint qui ne convient pas à l'équipe se désactive dans `eslint.config.mjs`, avec un commentaire qui la justifie.

---

## 10. Dépannage

### Installation et dev container

| Symptôme                                                     | Cause et solution                                                                                             |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `./setup.sh` → `Docker introuvable` dans `node@…:/workspace` | Tu es dans le dev container. Lance le script depuis un terminal de ta machine.                                |
| Zed : `Failed to start dev container: NotInValidProject`     | Zed a ouvert le dossier parent. Ouvre `hackathon-app` lui-même ([section 4](#4-coder-dans-le-dev-container)). |
| `port is already allocated`                                  | Un autre programme utilise 3000, 5173 ou 5433 : arrête-le, ou change le port dans `compose.yml`.              |
| Un changement de `db/init/*.sql` n'est pas pris en compte    | Ces fichiers ne sont joués qu'au premier démarrage : [réinitialise la base](#réinitialiser-la-base).          |

### Données Data/IA

| Symptôme                                                 | Cause et solution                                                                       |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `origin: "csv_fallback"` et `/health` → `down`           | Le tunnel ngrok est coupé ou a changé d'URL : demande la nouvelle à l'équipe Data/IA.   |
| `origin: "csv_fallback"` et `/health` → `non_configuree` | `DATA_AI_URL` est vide dans `api/.env`.                                                 |
| Logs : `bascule sur le CSV : erreur HTTP 401`            | `DATA_AI_KEY` ne correspond pas à la clé de l'équipe Data/IA.                           |
| Logs : `bascule sur le CSV : format inattendu`           | Data/IA a changé son format : adapter `api/app/clients/data_trends.py` et ses fixtures. |
| `POST /simulate` → `503`                                 | Repli CSV : la simulation a besoin du modèle Data/IA.                                   |

### Vercel

| Symptôme                                    | Cause et solution                                                                         |
| ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `404` sur une route de l'API                | Vercel ne retire pas le préfixe : toute route doit rester sous `/api`.                    |
| Les liens showroom pointent sur `localhost` | `PUBLIC_WEB_URL` n'est pas définie dans les variables Vercel.                             |
| Erreur de base au démarrage de l'API        | `DATABASE_URL` absente, ou schéma non joué : voir [section 7](#7-déploiement-sur-vercel). |

---

## 11. Sécurité

- **Jamais de `.env` dans git** (voir `.gitignore`). Seul `api/.env.example` est commité, sans vraie valeur.
- **Sur Vercel**, les secrets vont dans les variables du projet, jamais dans `vercel.json` ni `.vercelignore`. `.vercel/` n'est pas commité.
- **Identifiants PostgreSQL `app` / `app`** (`compose.yml`) : dev uniquement, ports publiés sur `127.0.0.1`. Ne les réutilise pas ailleurs.
- **Liens showroom** : le jeton est stocké haché et n'apparaît jamais dans les logs ([ADR 0010](docs/adr/0010-liens-showroom.md)).
- **Dev container sans Docker**, volontairement : monter le socket Docker donnerait un accès root à ta machine.
