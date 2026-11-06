// @ts-check
import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import tseslint from 'typescript-eslint';

export default defineConfig(
  // db/data : les fichiers de PostgreSQL, illisibles hors de son conteneur
  globalIgnores(['**/dist/', 'db/data/']),
  eslint.configs.recommended,
  tseslint.configs.recommended,
  // Désactive les règles de forme : c'est le travail de Prettier
  prettier,
);
