# project-init

Base de projet pour le hackathon : un front, une API, une base PostgreSQL et une IA locale (Ollama), le tout lancé avec Docker.

```
 navigateur ──► web (Vite, :5173) ──/api──► api (Express, :3000) ──► db (PostgreSQL, :5433)
                                                 │
                                                 ├──► Ollama en direct               (mode 1, par défaut)
                                                 └──► API de l'équipe Data/IA (ngrok)  (mode 2)
```

| Dossier         | Rôle                                                                 |
| --------------- | -------------------------------------------------------------------- |
| `web/`          | Front Vite + TypeScript. Les appels `/api` sont relayés vers l'API.  |
| `api/`          | API Express 5 + TypeScript, rechargée à chaque modification.         |
| `db/init/`      | Schéma et données de test, joués au **premier** démarrage de la base.|
| `.devcontainer/`| Image de dev partagée (Node 24 + `psql`), utilisée par VS Code / Zed.|

---

## 1. Ce qu'il faut avoir

**Obligatoire**

- [Docker](https://docs.docker.com/get-docker/) avec **Docker Compose v2** (`docker compose version` doit répondre).
- [Ollama](https://ollama.com/download) installé sur ta machine.
- Git.

**Optionnel**

- **VS Code** (extension *Dev Containers*) ou **Zed** : pour coder directement dans le conteneur.

Node n'est **pas** nécessaire sur ta machine : tout tourne dans les conteneurs.

> ⚠️ **Si vous utilisez Linux, vous devez configurer Ollama pour qu'il écoute sur `0.0.0.0`.** Par défaut il n'écoute que sur `127.0.0.1`, et le conteneur `api` ne peut pas le joindre. À faire une seule fois :
>
> ```bash
> sudo systemctl edit ollama
> # ajoute ces deux lignes, enregistre :
> # [Service]
> # Environment="OLLAMA_HOST=0.0.0.0"
> sudo systemctl restart ollama
> ```
>
> Vérification : `ss -ltn | grep 11434` doit afficher `0.0.0.0:11434` (ou `*:11434`).
>
> Sur macOS / Windows (Docker Desktop), rien à faire.

---

## 2. Lancer l'app en 3 commandes

```bash
# 1. Télécharger le modèle d'IA (une seule fois, ~1,3 Go)
ollama pull llama3.2:1b

# 2. Démarrer toute la stack
docker compose up -d

# 3. Ouvrir le front
xdg-open http://localhost:5173   # ou ouvre l'URL dans ton navigateur
```

Au premier lancement, le service `install` fait `npm ci` et crée `api/.env` à partir de `api/.env.example`. Ça prend une minute.

| URL                               | Quoi                                  |
| --------------------------------- | ------------------------------------- |
| http://localhost:5173             | Le front                              |
| http://localhost:3000/api/health  | Santé de l'API et version de la base  |
| `localhost:5433` (user/mdp `app`) | PostgreSQL (TablePlus, DBeaver, psql…) |

> ⚠️ **Sous Linux**, vérifie d'abord qu'Ollama écoute sur `0.0.0.0` (voir section 1), sinon l'IA ne répondra pas.

### Coder dans le conteneur (optionnel)

- **VS Code** : *Dev Containers: Reopen in Container*. VS Code démarre la stack et s'attache au service `dev`.
- **Zed** ou terminal : `docker compose exec dev bash`.

---

## 3. L'IA : deux modes

L'API choisit son mode selon `api/.env` :

- `DATA_AI_URL` **vide ou absente** → **mode 1** : l'API parle directement à Ollama.
- `DATA_AI_URL` **renseignée** → **mode 2** : l'API passe par l'API de l'équipe Data/IA.

### Mode 1 — Ollama en direct (par défaut)

Rien à configurer : `api/.env` pointe déjà sur `http://host.docker.internal:11434/v1`.

**Ollama n'a pas de clé d'API** : laisse `AI_API_KEY=` vide.

L'appel est compatible OpenAI. Pour passer sur un fournisseur commercial (Mistral, OpenAI…), il suffit de changer `AI_BASE_URL`, `AI_MODEL` et `AI_API_KEY` dans `api/.env` (exemples commentés dans `api/.env.example`).

### Mode 2 — L'API de l'équipe Data/IA

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

---

## 4. Commandes utiles

```bash
docker compose ps                    # état des services
docker compose logs -f api           # logs de l'API (ou web, db, install)
docker compose restart api           # après une modification de api/.env
docker compose down                  # tout arrêter
docker compose exec dev psql postgres://app:app@db:5432/app   # console SQL
```

**Réinitialiser la base** (rejoue `db/init/*.sql`) :

```bash
docker compose down
rm -rf db/data
docker compose up -d
```

---

## 5. Dépannage

| Symptôme                                                  | Cause probable / solution                                                                 |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `POST /api/questions` → `fetch failed` / `ECONNREFUSED`   | Ollama ne tourne pas, ou n'écoute que sur `127.0.0.1` (Linux : voir section 1).    |
| `IA : 404 … model "llama3.2:1b" not found`                | Le modèle n'est pas téléchargé : `ollama pull llama3.2:1b`.                               |
| `IA Data : 401 …`                                         | `DATA_AI_KEY` (api/.env) ne correspond pas à la clé de l'équipe Data/IA.                    |
| `IA Data : … timeout` / `aborted`                         | Le tunnel ngrok de l'équipe Data/IA est coupé : préviens-la, ou repasse en mode 1.          |
| `port is already allocated`                               | Un autre programme utilise 3000, 5173 ou 5433 : arrête-le ou change le port dans `compose.yml`. |
| Les modifications de `db/init/*.sql` ne sont pas prises   | Elles ne sont jouées qu'au premier démarrage : réinitialise la base (section 4).          |

---

## 6. Sécurité

- Les fichiers `.env` ne sont **jamais** commités (voir `.gitignore`). Seuls les `.env.example` le sont, sans vraie valeur.
- Les identifiants PostgreSQL `app` / `app` de `compose.yml` sont des identifiants **de dev uniquement** (ports publiés sur `127.0.0.1`). Ne les réutilise pas en production.
