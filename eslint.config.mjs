import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import { fileURLToPath } from 'node:url';

export default [
  { ignores: ['dist/**', 'node_modules/**', '.tmp/**', 'coverage/**'] },
  {
    files: ['apps/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: './tsconfig.json', tsconfigRootDir: fileURLToPath(new URL('.', import.meta.url)) },
      globals: { ...globals.node, ...globals.jest },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },
];
