# PLAN — Brancher le dashboard sur l'API (F2, socle de F1)

Objectif : le dashboard lit **nos** routes (`/dashboard/summary`, `/families`, `/trends`, `/trends/{id}`, `/report`, `/report/trends/{id}`, `/health`, `POST /report/issues`) au lieu des données en dur de `data.ts`, avec et sans l'API Data/IA.

## Ordre d'exécution

| Lot | Contenu                                                                   | Fichiers principaux                                                            |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | Contrat : types générés depuis `openapi.yaml`, client `openapi-fetch`     | `src/api/{schema.d,types,client,endpoints}.ts`                                 |
| 2   | Hooks de données : requête annulée à chaque changement, état dérivé       | `src/hooks/{useApiResource,useDebouncedValue,useTrendsApi,useTrendFilters}.ts` |
| 3   | Dashboard découpé : barre latérale, KPI, filtres, tableau / cartes, pages | `src/components/dashboard/`                                                    |
| 4   | Fiche arôme : indicateurs par source, série, preuves, signalement         | `src/components/dashboard/drawer/`                                             |
| 5   | Nettoyage : maquette et types de la maquette supprimés                    | `src/data.ts`, `src/types.ts`, `src/components/Charts.tsx`                     |

Agents : implémentation en séquence par l'orchestrateur (les lots partagent `api/types.ts`), relecture par l'agent `code-reviewer` avant de rendre la main.

## Écarts assumés

- **Pas de routeur** : l'ADR 0009 (`react-router`) n'est pas écrit. La bascule dashboard ↔ 3D reste un état d'`App.tsx` ; `main.tsx` teste seulement `/showroom/{jeton}`.
- **Retirés, faute de source dans l'API** : marché, présences TikTok / Google, agents MiroFish, backtesting, profils consommateurs, indice de confiance détaillé, simulation MiroFish, pipeline, badges de variation et sparkline en dur, favoris. Le `score` affiché est celui du modèle V2, pas MiroFish.
- **Copilote IA retiré** : `POST /questions` n'existe plus ([ADR 0011](../docs/adr/0011-retrait-questions-ia.md)).
- **Libellés d'indicateurs** : lus dans `GET /report` (`indicators`), pas recopiés de `core/indicators.py`. Les colonnes du tableau ne montrent que les indicateurs fournis par l'origine courante.
- **Types générés** (`npm run gen:api`) : `openapi-typescript` à la racine (il lui faut l'API JS de TypeScript 5), `openapi-fetch` dans `web` ([ADR 0012](../docs/adr/0012-types-front-openapi.md)).
- **Branche `data_ai`** écrite d'après les fixtures (`api/tests/fixtures/data_ai/`) : seul le repli CSV a été vu sur l'API réelle.

## Lot 2 — Vue immersive branchée, liens showroom

| Lot | Contenu                                                                        | Fichiers principaux                                                               |
| --- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| 6   | App ouverte sur le dashboard ; moteur 3D monté à l'entrée, libéré au retour    | `App.tsx`, `components/immersive/`, `components/Overlay.tsx`                      |
| 7   | Scan : fiche construite hors du moteur (`ScanCard`), dessinée sur la tablette  | `engine/types.ts`, `engine/experience.ts`, `engine/scene/scanner/screen.ts`       |
| 8   | Rayon 3D → familles d'arômes ; fiche depuis `/trends` (interne) ou le showroom | `immersive/{aisleFamilies,scanCard}.ts`                                           |
| 9   | Lien showroom : bouton du dashboard, page client `/showroom/{jeton}`           | `components/dashboard/ShowroomLinkDialog.tsx`, `components/showroom/`, `main.tsx` |

Écarts assumés :

- **Table rayon → familles** : choix métier (décision de l'utilisateur), à faire relire par l'équipe Data/IA.
- **Contrat showroom inchangé** (`id`, `name`, `family`, `aisle`, `status`, `score`) : en repli CSV, la fiche client n'affiche que les noms, sans croissance. Ajouter la croissance changerait ce que voient les clients.
- **Gestion des liens** (liste, révocation) : pas dans l'interface, routes API prêtes.
- **Verrouillage de la souris** : il exige un clic de l'utilisateur, d'où l'écran « Entrer dans le magasin » à chaque ouverture.

## Relecture (agent `code-reviewer`)

Corrigé : lien showroom mal formé qui ouvrait le dashboard (`main.tsx`) ; lien perdu à la fermeture du dialogue ; fiche de tablette figée sur « Chargement » (`Experience.refreshCard`) ; Échap / Tab actifs sur une vue masquée ; pagination sur une page périmée ; liens externes limités à `http(s)` ; dates `YYYY-MM-DD` lues en local ; doublons extraits (`Modal`, `useSubmission`, `useWindowKey`, `ORIGIN_LABELS`).

Restent ouverts :

- **Deux requêtes par recherche** : la page repasse à 1 avant la fin de l'anti-rebond. Sans gravité (la première est annulée).
- **Rayon Data/IA vs familles** : en `data_ai`, un arôme peut porter `aisle: "Boissons"` sans être dans les familles du rayon 3D Boissons. La fiche l'affiche comme « Rayon (Data/IA) » ; trancher avec l'équipe Data/IA (rattacher par `aisle` quand il existe ?).
- **Origine lue dans `/dashboard/summary` seulement** : si Data/IA tombe en cours de session, le bandeau n'apparaît qu'au rechargement.
