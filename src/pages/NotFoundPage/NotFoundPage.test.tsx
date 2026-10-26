import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import NotFoundPage from './NotFoundPage';

describe('NotFoundPage', () => {
  it('explains the address is unknown and links back to Overview', () => {
    render(
      <MemoryRouter initialEntries={['/explorer']}>
        <Routes>
          <Route path="/" element={<p>overview screen</p>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Page not found' })).toHaveClass('cds-state');
    expect(document.title).toBe('Page not found · Assortment tool');
    expect(screen.queryByTestId('screen-placeholder')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Go to Overview' }));
    expect(screen.getByText('overview screen')).toBeInTheDocument();
  });
});
