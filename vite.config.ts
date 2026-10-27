import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { powerApps } from '@microsoft/power-apps-vite/plugin';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), powerApps()],
  // exceljs is only reached through a dynamic import; pre-bundling it stops the dev server
  // from re-optimizing and reloading the page the first time an export or upload runs.
  optimizeDeps: { include: ['exceljs'] },
  // `vite --mode e2e` swaps the Power Apps host SDK and the data client for deterministic
  // stubs so Playwright never needs a live host or Dataverse environment
  // (specs/002-app-shell-tokens/research.md R9, specs/003-doors-screen/research.md R16).
  resolve:
    mode === 'e2e'
      ? {
          alias: {
            '@microsoft/power-apps/app': fileURLToPath(
              new URL('./e2e/fixtures/power-apps-app.stub.ts', import.meta.url),
            ),
            '@microsoft/power-apps/data': fileURLToPath(
              new URL('./e2e/fixtures/power-apps-data.stub.ts', import.meta.url),
            ),
          },
        }
      : undefined,
  build: {
    // antd alone (~786kB minified) exceeds the default 500kB warning even isolated into
    // its own vendor chunk (see manualChunks below); that chunk changes rarely and is
    // cached independently of app code, so the warning is expected noise, not a
    // regression signal. Raised so *new*, unexpected bundle growth still gets flagged.
    // Re-check this if ProComponents (an optional add-on, not a default dependency) or
    // another large dependency gets added.
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        // Vendor code (esp. antd) changes far less often than app code, so splitting
        // it into its own chunk(s) improves long-term browser caching and keeps any
        // single chunk under the 500kB warning threshold. See frontend-standards.md.
        codeSplitting: {
          groups: [
            {
              name: 'vendor-react',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            },
            {
              name: 'vendor-antd',
              test: /[\\/]node_modules[\\/](antd|@ant-design|@rc-component|rc-[^\\/]+)[\\/]/,
            },
            {
              name: 'vendor-query',
              test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
            },
            {
              // Only reached through `import('exceljs')` in src/lib/excel, so this chunk loads
              // on the first export or upload and never with the initial page.
              name: 'vendor-exceljs',
              test: /[\\/]node_modules[\\/]exceljs[\\/]/,
            },
          ],
        },
      },
    },
  },
}));
