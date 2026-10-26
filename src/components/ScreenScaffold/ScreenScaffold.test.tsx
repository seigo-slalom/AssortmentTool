import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { screenById } from '../../lib/screens';
import { ScreenScaffold } from './ScreenScaffold';

describe('ScreenScaffold', () => {
  it('renders the header, a masked placeholder region, and the document title', () => {
    render(
      <MemoryRouter>
        <ScreenScaffold screen={screenById('exceptions')} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Exceptions' })).toBeInTheDocument();
    const region = screen.getByTestId('screen-placeholder');
    expect(region).toHaveAttribute('data-visual-mask', '');
    expect(region).toHaveTextContent('Coming in a later spec');
    expect(region).toHaveTextContent(
      'Door and retailer exceptions arrive with the Exceptions spec.',
    );
    expect(document.title).toBe('Exceptions · Assortment tool');
  });

  it('renders custom children instead of the placeholder', () => {
    render(
      <MemoryRouter>
        <ScreenScaffold screen={screenById('not-found')}>
          <p>custom</p>
        </ScreenScaffold>
      </MemoryRouter>,
    );
    expect(screen.getByText('custom')).toBeInTheDocument();
    expect(screen.queryByTestId('screen-placeholder')).not.toBeInTheDocument();
  });
});
