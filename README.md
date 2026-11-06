# project-init

Base de projet pour le hackathon : un front, une API, une base PostgreSQL et une IA locale (Ollama), le tout lancé avec Docker.

```
 navigateur ──► web (Vite, :5173) ──/api──► api (Express, :3000) ──► db (PostgreSQL, :5433)
                                                 │
                                                 ├──► Ollama en direct               (mode 1, par défaut)
                                                 └──► API de l'équipe Data/IA (ngrok)  (mode 2)
```

| Dossier          | Rôle                                                                  |
| ---------------- | --------------------------------------------------------------------- |
| `web/`           | Front Vite + TypeScript. Les appels `/api` sont relayés vers l'API.   |
| `api/`           | API Express 5 + TypeScript, rechargée à chaque modification.          |
| `db/init/`       | Schéma et données de test, joués au **premier** démarrage de la base. |
| `.devcontainer/` | Conteneur `dev` pour VS Code / Zed (Node 24 slim + git + `psql`).     |

**Sommaire**

1. [Prérequis](#1-prérequis)
2. [Installation](#2-installation) : méthode 1 (à la main) ou méthode 2 (`setup.sh`)
3. [Coder dans le dev container](#3-coder-dans-le-dev-container)
4. [L'IA : deux modes](#4-lia--deux-modes)
5. [Commandes utiles](#5-commandes-utiles)
6. [Dépannage](#6-dépannage)
7. [Sécurité](#7-sécurité)

> 💡 **Où lancer quoi ?** Ce projet a deux terminaux possibles : celui de **ta machine** (l'hôte) et celui du **dev container**. Ils ne servent pas à la même chose.
>
> | Terminal                            | Pour                                                    |
> | ----------------------------------- | ------------------------------------------------------- |
> | Ta machine (hôte)                   | `./setup.sh`, `docker compose …`, `ollama …`            |
> | Dev container (`node@…:/workspace`) | Coder : `npm run lint`, `npm run format`, `git`, `psql` |

---

## 1. Prérequis

<details>
<summary><b>Ce qu'il faut installer sur ta machine</b></summary>

<br>

| Outil                                                           | Obligatoire ?                  | Vérification             |
| --------------------------------------------------------------- | ------------------------------ | ------------------------ |
| [Docker](https://docs.docker.com/get-docker/) + Compose v2      | Oui                            | `docker compose version` |
| Git                                                             | Oui                            | `git --version`          |
| [Ollama](https://ollama.com/download)                           | Oui en mode 1 de l'IA (défaut) | `ollama --version`       |
| VS Code (extension _Dev Containers_) ou [Zed](https://zed.dev/) | Non, pour coder dans Docker    |                          |

Node n'est **pas** nécessaire sur ta machine : tout tourne dans les conteneurs.

</details>

<details>
<summary><b>⚠️ Linux uniquement : faire écouter Ollama sur <code>0.0.0.0</code></b></summary>

<br>

Par défaut, Ollama n'écoute que sur `127.0.0.1` : le conteneur `api` ne peut pas le joindre. À faire **une seule fois** :

```bash
sudo systemctl edit ollama
# ajoute ces deux lignes, enregistre :
[Service]
Environment="OLLAMA_HOST=0.0.0.0"
sudo systemctl restart ollama
```

Vérification : `ss -ltn | grep 11434` doit afficher `0.0.0.0:11434` (ou `*:11434`).

Sur macOS / Windows (Docker Desktop), rien à faire.

</details>

---

## 2. Installation

Deux méthodes, au choix. Le résultat est le même : toute la stack tourne en arrière-plan.

> Les deux se lancent **depuis un terminal de ta machine**, à la racine du projet. Pas depuis le dev container.

```bash
git clone https://github.com/Hetic-Hackathon-Givaudan-2026-Fischer/hackathon-app.git
cd hackathon-app
```

<details>
<summary><b>Méthode 1 : installation classique, étape par étape</b></summary>

<br>

**1. Créer la configuration de l'API**

```bash
cp api/.env.example api/.env
```

Par défaut, `api/.env` pointe sur Ollama (mode 1). Pour le mode 2, voir [section 4](#4-lia--deux-modes).

**2. Télécharger le modèle d'IA** (une seule fois, ~1,3 Go)

```bash
ollama pull llama3.2:1b
```

Sous Linux, vérifie d'abord qu'Ollama écoute sur `0.0.0.0` ([section 1](#1-prérequis)).

**3. Démarrer la stack**

```bash
docker compose up -d --wait api web
```

`db` et `install` démarrent automatiquement avant. Au premier lancement, Docker télécharge les images et `install` fait un `npm ci` : compte une à deux minutes.

**4. Vérifier**

```bash
docker compose ps
```

`api`, `web` et `db` doivent être `healthy`. Puis ouvre les [URLs ci-dessous](#ce-qui-tourne-une-fois-lancé).

</details>

<details>
<summary><b>Méthode 2 : en une commande avec <code>setup.sh</code></b></summary>

<br>

```bash
./setup.sh
```

Le script fait les mêmes étapes que la méthode 1, avec des vérifications en plus. Il est **relançable sans risque** : ce qui est déjà fait est sauté.

| Étape         | Ce que fait le script                                                                     |
| ------------- | ----------------------------------------------------------------------------------------- |
| Hôte          | Refuse de tourner dans un conteneur (il faut le lancer depuis ta machine).                |
| Docker        | Vérifie que Docker est installé, que le démon répond et que Compose v2 est présent.       |
| Configuration | Crée `api/.env` à partir de `api/.env.example` s'il n'existe pas.                         |
| IA            | En mode 1 : vérifie qu'Ollama tourne, qu'il écoute sur `0.0.0.0` (Linux), pull le modèle. |
| Ports         | Vérifie que 3000, 5173 et 5433 sont libres (sauf si la stack tourne déjà).                |
| Démarrage     | `docker compose up -d --wait api web`, puis attend que tout soit sain.                    |

Sous Windows : lance-le depuis **Git Bash** ou **WSL**.

</details>

### Ce qui tourne une fois lancé

| URL                               | Quoi                                   |
| --------------------------------- | -------------------------------------- |
| http://localhost:5173             | Le front                               |
| http://localhost:3000/api/health  | Santé de l'API et version de la base   |
| `localhost:5433` (user/mdp `app`) | PostgreSQL (TablePlus, DBeaver, psql…) |

---

## 3. Coder dans le dev container

Optionnel, mais recommandé : l'éditeur s'attache au conteneur `dev`, avec Node, git, `psql`, ESLint et Prettier déjà configurés. Il démarre la stack tout seul s'il le faut.

> Le dev container ne gère **pas** Ollama : fais au moins une fois la méthode 1 ou 2 pour que le modèle soit téléchargé.

<details>
<summary><b>VS Code</b></summary>

<br>

1. Ouvre le dossier `hackathon-app`.
2. Palette (`Ctrl+Shift+P`) → _Dev Containers: Reopen in Container_.

VS Code démarre la stack et s'attache au service `dev`.

</details>

<details>
<summary><b>Zed</b></summary>

<br>

1. Ouvre **le dossier `hackathon-app` lui-même**, pas son dossier parent : Zed ne cherche `.devcontainer/` qu'à la racine du projet ouvert.
   ```bash
   zed chemin/vers/hackathon-app
   ```
2. Clique sur la notification _Open in Container_, ou palette (`Ctrl+Shift+P`) → _Open Dev Container_.

C'est bon quand le nom **Hackathon** apparaît en haut à gauche et que la racine du projet s'appelle **workspace**.

Après une modification de `.devcontainer/`, Zed ne reconstruit pas tout seul : `docker compose down` depuis ta machine, puis rouvre dans le conteneur.

</details>

<details>
<summary><b>Terminal seul, sans éditeur</b></summary>

<br>

```bash
docker compose up -d dev
docker compose exec dev bash
```

</details>

<details>
<summary><b>Vérifier que je suis bien dans le conteneur</b></summary>

<br>

Dans le terminal de l'éditeur :

```bash
whoami   # node
pwd      # /workspace
```

| Commande                | Dev container ? | Pourquoi                                                            |
| ----------------------- | --------------- | ------------------------------------------------------------------- |
| `npm run lint / format` | ✅              | Node et les dépendances sont dans le conteneur.                     |
| `git`, `gh`, `psql`     | ✅              | Installés dans l'image `dev`.                                       |
| `./setup.sh`            | ❌ → hôte       | Il pilote Docker et Ollama de ta machine.                           |
| `docker compose …`      | ❌ → hôte       | Pas de Docker dans le conteneur (ce serait un accès root à l'hôte). |
| `ollama …`              | ❌ → hôte       | Ollama tourne sur ta machine.                                       |

</details>

---

## 4. L'IA : deux modes

L'API choisit son mode selon `api/.env` :

| `DATA_AI_URL` dans `api/.env` | Mode                                                    |
| ----------------------------- | ------------------------------------------------------- |
| vide ou absente               | **Mode 1** : l'API parle directement à Ollama.          |
| renseignée                    | **Mode 2** : l'API passe par l'API de l'équipe Data/IA. |

<details>
<summary><b>Mode 1 : Ollama en direct (par défaut)</b></summary>

<br>

Rien à configurer : `api/.env` pointe déjà sur `http://host.docker.internal:11434/v1`.

**Ollama n'a pas de clé d'API** : laisse `AI_API_KEY=` vide.

L'appel est compatible OpenAI. Pour passer sur un fournisseur commercial (Mistral, OpenAI…), il suffit de changer `AI_BASE_URL`, `AI_MODEL` et `AI_API_KEY` dans `api/.env` (exemples commentés dans `api/.env.example`).

</details>

<details>
<summary><b>Mode 2 : l'API de l'équipe Data/IA</b></summary>

<br>

L'équipe Data/IA héberge sa propre API (derrière un tunnel ngrok) et la protège avec une **clé d'API** (en-tête `X-API-Key`). C'est elle qui génère la clé, par exemple avec :

```bash
openssl rand -hex 32
```

Elle te transmet l'URL et la clé **hors de git** (message privé, gestionnaire de mots de passe). Ajoute-les dans `api/.env` :

```bash
DATA_AI_URL=https://xxxx.ngrok-free.app
DATA_AI_KEY=<la-clé-fournie-par-l-équipe-Data/IA>
```

Puis `docker compose restart api`.

Le contrat attendu (voir le Swagger de l'équipe, sur `<DATA_AI_URL>/docs`) :

```bash
curl -X POST "$DATA_AI_URL/answer" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $DATA_AI_KEY" \
  -d '{"question": "Bonjour ?"}'
# → {"answer": "...", "model": "..."}
```

Si leur machine se met en veille ou que le tunnel tombe, l'API abandonne au bout de 30 secondes. Pour revenir au mode 1, vide `DATA_AI_URL` et redémarre l'API.

</details>

---

## 5. Commandes utiles

<details>
<summary><b>Docker : gérer la stack</b> (depuis ta machine)</summary>

<br>

| Commande                                 | Effet                                     |
| ---------------------------------------- | ----------------------------------------- |
| `docker compose ps`                      | État des services                         |
| `docker compose logs -f api`             | Logs de l'API (ou `web`, `db`, `install`) |
| `docker compose restart api`             | Après une modification de `api/.env`      |
| `docker compose down`                    | Tout arrêter                              |
| `docker compose exec db psql -U app app` | Console SQL                               |

</details>

<details>
<summary><b>Réinitialiser la base</b> (rejoue <code>db/init/*.sql</code>)</summary>

<br>

Depuis ta machine :

```bash
docker compose down
rm -rf db/data
./setup.sh
```

</details>

<details>
<summary><b>Qualité du code : ESLint, Prettier et hook pre-commit</b> (depuis le dev container)</summary>

<br>

| Outil        | Rôle                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| **ESLint**   | Détecte les erreurs probables (variable inutilisée, promesse oubliée, `any`…).                             |
| **Prettier** | S'occupe de la forme (guillemets, indentation, retours à la ligne).                                        |
| **husky**    | À chaque commit, lance **lint-staged** : ESLint (`--fix`) et Prettier sur les fichiers indexés uniquement. |

Le dev container les branche dans VS Code et Zed : formatage à l'enregistrement, corrections ESLint à la demande.

À la racine, dans le conteneur `dev` :

```bash
npm run lint           # ESLint sur tout le projet
npm run format         # Prettier réécrit les fichiers
npm run format:check   # Prettier vérifie sans modifier (CI)
```

Le hook pre-commit s'active à la création du dev container (script `prepare`). `db/data` (dossier de PostgreSQL) est exclu. Une règle ESLint qui ne convient pas à l'équipe se désactive dans `eslint.config.mjs`, avec un commentaire qui la justifie.

</details>

---

## 6. Dépannage

<details>
<summary><b>Installation et dev container</b></summary>

<br>

| Symptôme                                                     | Cause probable / solution                                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `./setup.sh` → `Docker introuvable` dans `node@…:/workspace` | Tu es dans le dev container. Lance le script depuis un terminal de ta machine.                                     |
| Zed : `Failed to start dev container: NotInValidProject`     | Zed a ouvert le dossier parent. Ouvre `hackathon-app` lui-même (voir [section 3](#3-coder-dans-le-dev-container)). |
| `port is already allocated`                                  | Un autre programme utilise 3000, 5173 ou 5433 : arrête-le ou change le port dans `compose.yml`.                    |
| Les modifications de `db/init/*.sql` ne sont pas prises      | Elles ne sont jouées qu'au premier démarrage : [réinitialise la base](#5-commandes-utiles).                        |

</details>

<details>
<summary><b>IA</b></summary>

<br>

| Symptôme                                                | Cause probable / solution                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `POST /api/questions` → `fetch failed` / `ECONNREFUSED` | Ollama ne tourne pas, ou n'écoute que sur `127.0.0.1` (Linux : [section 1](#1-prérequis)). |
| `IA : 404 … model "llama3.2:1b" not found`              | Le modèle n'est pas téléchargé : `ollama pull llama3.2:1b`.                                |
| `IA Data : 401 …`                                       | `DATA_AI_KEY` (`api/.env`) ne correspond pas à la clé de l'équipe Data/IA.                 |
| `IA Data : … timeout` / `aborted`                       | Le tunnel ngrok de l'équipe Data/IA est coupé : préviens-la, ou repasse en mode 1.         |

</details>

---

## 7. Sécurité

- Les fichiers `.env` ne sont **jamais** commités (voir `.gitignore`). Seuls les `.env.example` le sont, sans vraie valeur.
- Les identifiants PostgreSQL `app` / `app` de `compose.yml` sont des identifiants **de dev uniquement** (ports publiés sur `127.0.0.1`). Ne les réutilise pas en production.
- Le dev container n'a volontairement pas accès à Docker : monter le socket Docker reviendrait à lui donner un accès root à ta machine.
