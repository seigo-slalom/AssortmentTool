import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

const ROUTES = [
  { path: '/', title: 'Overview', current: 'Overview' },
  { path: '/doors', title: 'Doors', current: 'Doors' },
  { path: '/doors/D-001', title: 'Door detail', current: 'Doors' },
  { path: '/doors/mass-update', title: 'Mass update', current: 'Doors' },
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
      expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();
      const currentLinks = screen
        .getAllByRole('link')
        .filter((link) => link.getAttribute('aria-current') === 'page');
      expect(currentLinks.map((l) => l.textContent)).toEqual([current]);
      expect(document.title).toBe(`${title} · Assortment tool`);
    },
  );

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
