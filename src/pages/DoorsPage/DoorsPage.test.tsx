import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import DoorsPage from './DoorsPage';

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/doors']}>
      <DoorsPage />
    </MemoryRouter>,
  );

describe('DoorsPage', () => {
  it('renders the prototype page header and document title', () => {
    renderPage();
    expect(screen.getByTestId('page-eyebrow')).toHaveTextContent('Strategy');
    expect(screen.getByRole('heading', { level: 1, name: 'Doors' })).toBeInTheDocument();
    expect(document.title).toBe('Doors · Assortment tool');
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
