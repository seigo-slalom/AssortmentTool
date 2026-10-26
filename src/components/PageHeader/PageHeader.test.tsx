import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PageHeader } from './PageHeader';

const renderAt = (ui: ReactNode) =>
  render(
    <MemoryRouter initialEntries={['/doors/mass-update']}>
      <Routes>
        <Route path="/doors/mass-update" element={ui} />
        <Route path="/doors" element={<p>doors screen</p>} />
      </Routes>
    </MemoryRouter>,
  );

describe('PageHeader', () => {
  it('renders the eyebrow and a single h1 title', () => {
    renderAt(<PageHeader title="Overview" eyebrow="Fragrance & Beauty · United States" />);
    expect(screen.getByTestId('page-header').tagName).toBe('HEADER');
    expect(screen.getByTestId('page-eyebrow')).toHaveTextContent(
      'Fragrance & Beauty · United States',
    );
    expect(screen.getByTestId('page-eyebrow')).toHaveClass('cds-prominent-label');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByTestId('page-title')).toHaveTextContent('Overview');
  });

  it('omits every optional part when not provided', () => {
    renderAt(<PageHeader title="Doors" />);
    expect(screen.queryByTestId('page-eyebrow')).not.toBeInTheDocument();
    expect(screen.queryByTestId('page-description')).not.toBeInTheDocument();
    expect(screen.queryByTestId('page-actions')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
  });

  it('renders description and actions', () => {
    renderAt(
      <PageHeader title="Doors" description="All doors" actions={<button>Export</button>} />,
    );
    expect(screen.getByTestId('page-description')).toHaveTextContent('All doors');
    expect(screen.getByTestId('page-actions')).toContainElement(
      screen.getByRole('button', { name: 'Export' }),
    );
  });

  it('renders breadcrumb links followed by the current title', () => {
    renderAt(<PageHeader title="Mass update" breadcrumb={[{ label: 'Doors', to: '/doors' }]} />);
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(crumbs).toHaveTextContent(/Doors.*Mass update/);
    fireEvent.click(screen.getByRole('link', { name: 'Doors' }));
    expect(screen.getByText('doors screen')).toBeInTheDocument();
  });

  it('treats an empty breadcrumb as none', () => {
    renderAt(<PageHeader title="Doors" breadcrumb={[]} />);
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
  });
});
