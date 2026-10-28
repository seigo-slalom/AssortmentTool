/* eslint-disable react-refresh/only-export-components -- test helper module */
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ASSORTMENT_DATA_KEY, type AssortmentRecords } from '../lib/data';

/** Shows the current location so tests can assert navigation. */
export function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
}

export interface RenderOptions {
  /** Initial URL, e.g. `/doors?saved=closed`. */
  route?: string;
  /** Route pattern the element is mounted at. */
  path?: string;
  /** Seeds the shared data query; omit to let the (mocked) loader run. */
  records?: AssortmentRecords;
  /** Initial router state, e.g. a Bulk Update entry intent. */
  state?: unknown;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', path = '*', records, state }: RenderOptions = {},
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (records) client.setQueryData(ASSORTMENT_DATA_KEY, structuredClone(records));
  const result = render(
    <QueryClientProvider client={client}>
      <MemoryRouter
        initialEntries={[
          {
            pathname: route.split('?')[0],
            search: route.includes('?') ? `?${route.split('?')[1]}` : '',
            state,
          },
        ]}
      >
        <Routes>
          <Route path={path} element={ui} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...result, client };
}
