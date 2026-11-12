# 0012. Les types du front sont générés depuis `openapi.yaml`, les appels passent par `openapi-fetch`

- Statut : acceptée
- Date : 2026-11-12
- Décideurs : Arnaud Fischer

## Contexte

Le front appelle notre API (dashboard, rapport, showroom). Les schémas Pydantic produisent déjà [`openapi.yaml`](../../openapi.yaml), contrôlé en CI. Recopier ces types à la main dans le front crée une seconde source, qui dérive sans erreur de compilation.

## Options

1. Types écrits à la main + `fetch` : aucune dépendance, mais deux sources et des chemins en chaînes libres.
2. `openapi-typescript` (génération) + `openapi-fetch` (client typé, ~6 ko) : chemins, paramètres et réponses vérifiés par `tsc`.
3. Générateur de client complet (`@hey-api/openapi-ts`, `orval`) : plus de code généré et de configuration pour le même gain.

## Décision

Option 2.

| Élément                                              | Rôle                                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| `openapi-typescript` (racine, dev)                   | `npm run gen:api` : `openapi.yaml` → `web/src/api/schema.d.ts`.            |
| `openapi-fetch` (`web`)                              | Client typé sur `paths`, créé une seule fois dans `web/src/api/client.ts`. |
| [`web/src/api/types.ts`](../../web/src/api/types.ts) | Alias lisibles (`TrendRead`…) sur `components['schemas']`.                 |

Règles :

- Jamais d'édition de `schema.d.ts` : modifier les schémas Pydantic, réexporter `openapi.yaml`, puis `npm run gen:api`.
- Jamais de type d'API écrit à la main : un alias dans `types.ts`, rien d'autre.
- Jamais de `fetch` ni d'import d'`openapi-fetch` hors de `web/src/api/`.
- La CI échoue si `schema.d.ts` ne correspond plus à `openapi.yaml`.
- `openapi-typescript` reste à la racine : il utilise l'API JS de TypeScript 5, absente de TypeScript 7 (workspace `web`).

## Conséquences

- Positives : une seule source pour les types (Pydantic) ; un champ renommé côté API casse `npm run build` ; plus de chemins en chaînes libres.
- Négatives, à accepter : `openapi-fetch` est en 0.x (API susceptible de changer) ; un fichier généré de ~1 400 lignes commité ; deux versions de TypeScript dans le dépôt.
- À revoir si : `openapi-typescript` accepte TypeScript 7 (le passer dans `web`) ; `openapi-fetch` change d'API en 1.0.
