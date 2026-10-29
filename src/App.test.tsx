import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { TEST_RECORDS } from './lib/doors/fixtures.testutil';

vi.mock('./lib/data/records', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./lib/data/records')>()),
  loadAssortmentRecords: vi.fn(() => Promise.resolve(structuredClone(TEST_RECORDS))),
}));

const renderAt = (path: string) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );

const ROUTES = [
  { path: '/', title: 'Overview', current: 'Overview' },
  { path: '/doors', title: 'Doors', current: 'Doors' },
  { path: '/doors/D-001', title: 'Door detail', current: 'Doors' },
  { path: '/doors/bulk-update', title: 'Bulk Update', current: 'Doors' },
  { path: '/tier-assortments', title: 'Tier assortments', current: 'Tier assortments' },
  { path: '/exceptions', title: 'Exceptions', current: 'Exceptions' },
] as const;

const EXCLUDED = ['/explorer', '/exports', '/activity', '/data-sources', '/parking-lot', '/nope'];

describe('App', () => {
  it('renders the branded frame with Overview selected by default', async () => {
    renderAt('/');
    expect(screen.getByTestId('app-name')).toHaveTextContent('Assortment tool');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual(['Overview', 'Doors', 'Tier assortments', 'Exceptions']);
    expect(await screen.findByRole('heading', { level: 1, name: 'Overview' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it.each(ROUTES)(
    'routes $path to $title with $current selected',
    async ({ path, title, current }) => {
      renderAt(path);
      // Lazily loaded screens can take over a second to mount under coverage instrumentation.
      expect(
        await screen.findByRole('heading', { level: 1, name: title }, { timeout: 5000 }),
      ).toBeInTheDocument();
      const currentLinks = screen
        .getAllByRole('link')
        .filter((link) => link.getAttribute('aria-current') === 'page');
      expect(currentLinks.map((l) => l.textContent)).toEqual([current]);
      expect(document.title).toBe(`${title} · Assortment tool`);
    },
  );

  it('redirects the old Mass update address to Bulk Update with Doors selected', async () => {
    renderAt('/doors/mass-update');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Bulk Update' }),
    ).toBeInTheDocument();
    const current = screen
      .getAllByRole('link')
      .filter((l) => l.getAttribute('aria-current') === 'page');
    expect(current.map((l) => l.textContent)).toEqual(['Doors']);
  });

  it.each(EXCLUDED)(
    'shows Page not found for %s and never links excluded screens',
    async (path) => {
      renderAt(path);
      expect(
        await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
      ).toBeInTheDocument();
      expect(
        screen.queryAllByRole('link').filter((l) => l.getAttribute('aria-current')),
      ).toHaveLength(0);
      for (const label of ['Explorer', 'Exports', 'Activity', 'Data sources', 'Parking lot']) {
        expect(screen.queryByRole('link', { name: label })).not.toBeInTheDocument();
      }
    },
  );
});
