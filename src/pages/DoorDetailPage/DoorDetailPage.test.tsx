import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import DoorDetailPage from './DoorDetailPage';

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/doors/D-001']}>
      <DoorDetailPage />
    </MemoryRouter>,
  );

describe('DoorDetailPage', () => {
  it('renders the prototype page header and document title', () => {
    renderPage();
    expect(screen.getByTestId('page-eyebrow')).toHaveTextContent('Strategy');
    expect(screen.getByRole('heading', { level: 1, name: 'Door detail' })).toBeInTheDocument();
    expect(document.title).toBe('Door detail · Assortment tool');
  });

  it('shows one labeled placeholder region and no sample data', () => {
    renderPage();
    const region = screen.getByTestId('screen-placeholder');
    expect(region).toHaveAttribute('data-visual-mask', '');
    expect(within(region).getByText('Coming in a later spec')).toBeInTheDocument();
    expect(region.textContent).not.toMatch(/\d/);
  });

  it('shows a Doors breadcrumb that returns to Doors', () => {
    renderPage();
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(crumbs).getByRole('link', { name: 'Doors' })).toHaveAttribute('href', '/doors');
  });
});
