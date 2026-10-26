import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import TierAssortmentsPage from './TierAssortmentsPage';

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/tier-assortments']}>
      <TierAssortmentsPage />
    </MemoryRouter>,
  );

describe('TierAssortmentsPage', () => {
  it('renders the prototype page header and document title', () => {
    renderPage();
    expect(screen.getByTestId('page-eyebrow')).toHaveTextContent('Strategy');
    expect(screen.getByRole('heading', { level: 1, name: 'Tier assortments' })).toBeInTheDocument();
    expect(document.title).toBe('Tier assortments · Assortment tool');
  });

  it('shows one labeled placeholder region and no sample data', () => {
    renderPage();
    const region = screen.getByTestId('screen-placeholder');
    expect(region).toHaveAttribute('data-visual-mask', '');
    expect(within(region).getByText('Coming in a later spec')).toBeInTheDocument();
    expect(region.textContent).not.toMatch(/\d/);
  });

  it('has no breadcrumb', () => {
    renderPage();
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
  });
});
