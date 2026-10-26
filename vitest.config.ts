import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // Process CSS Modules with stable, unscoped class names so tests can assert on them.
    css: { include: [/.+/], modules: { classNameStrategy: 'non-scoped' } },
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/generated/**',
        'src/main.tsx',
        'src/test/**',
        '**/*.test.{ts,tsx}',
        '**/*.testutil.ts',
        '**/*.d.ts',
        '**/types.ts',
      ],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
});
