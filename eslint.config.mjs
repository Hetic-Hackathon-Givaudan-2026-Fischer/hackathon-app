// @ts-check
import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  // db/data : les fichiers de PostgreSQL, illisibles hors de son conteneur.
  // .venv : l'environnement Python de l'API (paquets tiers, parfois avec du JS)
  globalIgnores(['**/dist/', 'db/data/', '**/.venv/']),
  eslint.configs.recommended,
  tseslint.configs.recommended,
  // Le front React : globales du navigateur, règles des hooks, HMR de Vite
  {
    files: ['web/src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
  },
  // Désactive les règles de forme : c'est le travail de Prettier
  prettier,
);
