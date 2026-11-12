# 0006. Cadrer les agents IA par AGENTS.md, les ADR et les skills

- Statut : acceptée
- Date : 2026-11-10
- Décideurs : Arnaud Fischer

## Contexte

Une partie du code est écrite par des agents IA (Claude Code, Codex…), en parallèle. Sans cadre commun, chaque session fait ses propres choix. Les skills génériques (dont le skill officiel FastAPI) contredisent parfois nos décisions.

## Options

1. Pas de consignes : choix divergents d'une session à l'autre.
2. Un fichier par agent (`CLAUDE.md`, `.cursorrules`…) : règles dupliquées qui dérivent.
3. Une source unique (`AGENTS.md`), des ADR courts et directifs, des skills versionnés, avec un ordre de priorité explicite.

## Décision

Option 3.

| Fichier                                                    | Rôle                                                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [`AGENTS.md`](../../AGENTS.md)                             | Seule source des consignes agents : architecture, règles de dev, tests, commandes. Lu par Codex.     |
| [`CLAUDE.md`](../../CLAUDE.md)                             | Contient uniquement `@AGENTS.md` : Claude Code lit les mêmes consignes. Jamais de règle propre.      |
| [`docs/adr/`](./)                                          | Le pourquoi et les règles de chaque choix. Source de vérité.                                         |
| [`.agents/skills/fastapi/`](../../.agents/skills/fastapi/) | Skill officiel FastAPI : conventions d'écriture (`Annotated`, types de retour, routers, async/sync). |

Ordre de priorité, du plus fort au plus faible :

1. ADR « acceptée » ;
2. `AGENTS.md` ;
3. skill ;
4. habitudes de l'agent.

Quel ADR lire avant de toucher à :

| Sujet                                    | ADR                                               |
| ---------------------------------------- | ------------------------------------------------- |
| `api/.env`, sources de données           | [0008](0008-source-tendances-repli.md) (proposée) |
| `compose.yml`, Dockerfile, dev container | [0002](0002-docker-compose.md)                    |
| `vercel.json`, déploiement               | [0013](0013-deploiement-vercel.md) (proposée)     |
| `api/tests/`, `tests.yml`                | [0003](0003-tests.md)                             |
| `api/app/`, dépendances Python, base     | [0004](0004-backend-fastapi.md)                   |
| `security.yml`, secrets                  | [0005](0005-ci-securite.md)                       |
| `AGENTS.md`, `CLAUDE.md`, skills, ADR    | [0006](0006-cadre-agents-ia.md)                   |
| `web/`, dépendances npm du front         | [0007](0007-front-react.md)                       |
| appels réseau et types du front          | [0012](0012-types-front-openapi.md)               |
| tendances, Data/IA, CSV de repli         | [0008](0008-source-tendances-repli.md) (proposée) |
| liens showroom                           | [0010](0010-liens-showroom.md) (proposée)         |

Écarts entre le skill FastAPI et ce dépôt (l'ADR gagne) :

| Le skill conseille             | Ce dépôt fait                                                            |
| ------------------------------ | ------------------------------------------------------------------------ |
| SQLModel plutôt que SQLAlchemy | SQLAlchemy async + asyncpg ([0004](0004-backend-fastapi.md))             |
| `fastapi dev`                  | `uvicorn --reload` via `docker compose` ([0002](0002-docker-compose.md)) |
| ajouter Asyncer, ty…           | aucune dépendance sans ADR                                               |

Règles :

- Lire l'ADR concerné avant d'ajouter une dépendance ou de changer de composant.
- Ne jamais contredire un ADR « acceptée ». Pour en changer : nouvel ADR « proposée » depuis [`0000-modele.md`](0000-modele.md), puis s'arrêter.
- Un ADR passe à « acceptée » sur validation d'un décideur, ou s'il décrit ce qui est déjà en place.
- Format d'un ADR : court, tableaux, liste « Règles » à l'impératif, liens directs vers le code. Pas de prose.
- Une règle n'est écrite qu'à un endroit : dans l'ADR, `AGENTS.md` la résume et renvoie à l'ADR.
- Nouveau skill : dans `.agents/skills/<nom>/`, source officielle, versionné ; ses écarts avec les ADR sont listés ici.
- Code, ADR et commentaires en français.

## Conséquences

- Positives : mêmes consignes pour tous les agents ; décisions stables d'une session à l'autre ; ADR courts, donc peu de contexte consommé.
- Négatives : chaque changement de décision demande de mettre à jour l'ADR et `AGENTS.md` ; Claude Code ne découvre pas seul `.agents/skills/` (il faut le citer dans la demande).
- À revoir si : un agent ne lit ni `AGENTS.md` ni `CLAUDE.md` ; Claude Code doit charger le skill seul (lien `.claude/skills/fastapi` → `.agents/skills/fastapi`) ; les écarts avec un skill deviennent trop nombreux (l'adapter ou le retirer).
