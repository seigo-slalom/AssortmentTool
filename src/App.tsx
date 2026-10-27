import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { RegionState } from './components/RegionState';
import { NAV_DESTINATIONS } from './lib/navigation';
import { APP_NAME, SCREENS, type ScreenId } from './lib/screens';

// One lazily loaded module per screen (src/pages/<Screen>Page). Excluded prototype screens
// are intentionally absent and fall through to NotFoundPage.
const PAGES: Record<ScreenId, LazyExoticComponent<ComponentType>> = {
  overview: lazy(() => import('./pages/OverviewPage')),
  doors: lazy(() => import('./pages/DoorsPage')),
  'door-detail': lazy(() => import('./pages/DoorDetailPage')),
  'bulk-update': lazy(() => import('./pages/BulkUpdatePage')),
  'tier-assortments': lazy(() => import('./pages/TierAssortmentsPage')),
  exceptions: lazy(() => import('./pages/ExceptionsPage')),
  'not-found': lazy(() => import('./pages/NotFoundPage')),
};

export default function App() {
  return (
    <AppShell appName={APP_NAME} items={NAV_DESTINATIONS}>
      <Suspense fallback={<RegionState state="loading" />}>
        <Routes>
          {/* Mass update was renamed Bulk Update; keep old links working. */}
          <Route path="/doors/mass-update" element={<Navigate replace to="/doors/bulk-update" />} />
          {SCREENS.map(({ id, path }) => {
            const Page = PAGES[id];
            return <Route key={id} path={path} element={<Page />} />;
          })}
        </Routes>
      </Suspense>
    </AppShell>
  );
}
