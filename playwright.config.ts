import { defineConfig, devices } from '@playwright/test';

const PORT = 5174;

// Projects (specs/002-app-shell-tokens/research.md R8):
// - e2e: structure, responsive matrix, accessibility, host states against the stubbed host.
// - visual: compares the app with baselines captured from the prototype.
// - prototype-baseline: captures those baselines from docs/Assortment-Tool-Prototype.html;
//   run only by a human with --update-snapshots.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  snapshotPathTemplate: '{testDir}/visual/__baselines__/{arg}{ext}',
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'hide' },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'e2e',
      testMatch: 'shell/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'visual',
      testMatch: 'visual/app.visual.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'prototype-baseline',
      testMatch: 'visual/prototype.capture.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx vite --mode e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
