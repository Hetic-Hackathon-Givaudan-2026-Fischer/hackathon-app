# 0007. Le front est en React + TypeScript + Tailwind, la scène 3D en three.js impératif

- Statut : acceptée
- Date : 2026-11-12
- Décideurs : Arnaud Fischer

## Contexte

Le product a prototypé le « magasin 3D » en HTML/CSS/JS vanilla (~4 400 lignes, dont ~3 800 de three.js procédural). L'équipe code en React + TypeScript + Tailwind ; le prototype doit devenir maintenable, typé, et accueillir de l'interface (fiches, panneaux, appels `/api`).

## Options

1. Garder le vanilla JS : rien à faire, mais pas de types ni de composants.
2. React + React Three Fiber : scène en JSX, mais réécriture totale ; le rendu en deux passes par calques et la génération procédurale s'y prêtent mal.
3. React + Tailwind pour l'interface, three.js impératif en TypeScript pour la scène, reliés par un hook.

## Décision

Option 3.

| Couche | Où                                                     | Rôle                                                                |
| ------ | ------------------------------------------------------ | ------------------------------------------------------------------- |
| UI     | [`web/src/components/`](../../web/src/components/)     | Composants React, Tailwind uniquement, sans logique 3D.             |
| Pont   | [`web/src/hooks/`](../../web/src/hooks/)               | `useExperience` : monte / libère le moteur, expose son état.        |
| Moteur | [`web/src/engine/`](../../web/src/engine/)             | three.js impératif ; seul point d'entrée : `createExperience`.      |
| Scène  | [`web/src/engine/scene/`](../../web/src/engine/scene/) | Un dossier par élément (`market`, `products`, `nature`, `scanner`). |

Dépendances : `react`, `react-dom` 19 ; `tailwindcss` 4 (`@tailwindcss/vite`) ; `@vitejs/plugin-react` ; `three` 0.170 ; ESLint `react-hooks` et `react-refresh`.

Règles :

- Jamais d'import de `three` dans `components/` ni de React dans `engine/`.
- Le moteur parle à React par callbacks (`ExperienceEvents`), émis seulement quand la valeur change.
- Tout ce que crée le moteur est libéré par `dispose()` (React StrictMode monte deux fois).
- Les types partagés du moteur sont dans [`engine/types.ts`](../../web/src/engine/types.ts) ; les outils canvas dans [`scene/shared/canvas.ts`](../../web/src/engine/scene/shared/canvas.ts).
- Style : classes Tailwind ; jetons de la charte dans `@theme` ([`index.css`](../../web/src/index.css)), alignés sur [`brand.ts`](../../web/src/brand.ts).
- `npm run build` vérifie les types (`tsc`) avant `vite build`.

## Conséquences

- Positives : code typé et découpé ; l'UI évolue en React sans toucher à la scène ; rendu identique au prototype.
- Négatives : charte en double (`brand.ts` pour le canvas, `@theme` pour Tailwind) ; la scène n'est pas déclarative.
- À revoir si : la scène doit réagir finement à l'état React (passer à React Three Fiber) ; la charte change souvent (générer l'un depuis l'autre).
