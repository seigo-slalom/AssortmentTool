import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // Code apps run in a sandbox where direct outbound HTTP fails at runtime — data
    // access must go through generated services (see power-platform-code-apps.md).
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/generated/**'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message:
            'Direct fetch() is not allowed in code apps. Use a generated service from src/generated/services (run `pa app add data-source`).',
        },
        {
          name: 'XMLHttpRequest',
          message:
            'Direct XMLHttpRequest is not allowed in code apps. Use a generated service from src/generated/services.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'axios',
              message:
                'axios is not allowed in code apps. Use a generated connector service instead.',
            },
            {
              name: 'node-fetch',
              message:
                'node-fetch is not allowed in code apps. Use a generated connector service instead.',
            },
            {
              name: 'cross-fetch',
              message:
                'cross-fetch is not allowed in code apps. Use a generated connector service instead.',
            },
            {
              name: '@microsoft/microsoft-graph-client',
              message:
                'Direct Graph SDK calls are not allowed in code apps. Use a generated connector service instead.',
            },
          ],
          patterns: [
            {
              group: ['@azure/*'],
              message:
                'Direct Azure SDK calls are not allowed in code apps. Use a generated connector service instead.',
            },
          ],
        },
      ],
    },
  },
  {
    // Principle XIII: the engine core is pure (no React, I/O, generated services, or adapters).
    files: ['src/features/engine/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react-dom/*', 'antd', '@microsoft/power-apps*'],
              message: 'The engine core must stay pure: no UI or platform imports.',
            },
            {
              group: ['**/generated/**', '**/adapters/**'],
              message: 'The engine core must not import generated services or adapters.',
            },
          ],
        },
      ],
    },
  },
]);
