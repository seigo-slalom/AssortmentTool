// Deterministic stand-in for `@microsoft/power-apps/app`, aliased only in `vite --mode e2e`
// (see vite.config.ts) so Playwright can exercise the shell without a Power Apps host.
// `?host=error` rejects, `?host=slow` delays resolution, anything else resolves at once.
import type { IContext } from '@microsoft/power-apps/app';

const fixture: IContext = {
  app: {
    appId: 'e2e-app',
    appSettings: {},
    environmentId: 'e2e-environment',
    queryParams: {},
  },
  host: { sessionId: 'e2e-session' },
  user: {
    fullName: 'E2E Tester',
    objectId: 'e2e-user',
    tenantId: 'e2e-tenant',
    userPrincipalName: 'e2e.tester@example.com',
  },
} as IContext;

const SLOW_DELAY_MS = 1500;

export function getContext(): Promise<IContext> {
  const mode = new URLSearchParams(window.location.search).get('host');
  if (mode === 'error') {
    return Promise.reject(new Error('Stubbed host failure'));
  }
  if (mode === 'slow') {
    return new Promise((resolve) => setTimeout(() => resolve(fixture), SLOW_DELAY_MS));
  }
  return Promise.resolve(fixture);
}

export function setConfig(): void {}
