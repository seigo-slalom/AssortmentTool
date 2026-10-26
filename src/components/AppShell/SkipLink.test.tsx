import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SkipLink } from './SkipLink';

describe('SkipLink', () => {
  it('links to the main content and moves focus there without changing the hash', () => {
    render(
      <>
        <SkipLink targetId="main-content" />
        <main id="main-content" tabIndex={-1}>
          content
        </main>
      </>,
    );
    const link = screen.getByRole('link', { name: 'Skip to main content' });
    expect(link).toHaveAttribute('href', '#main-content');
    expect(link).toHaveClass('skip');

    const notPrevented = fireEvent.click(link);
    expect(notPrevented).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole('main'));
  });

  it('does nothing when the target is missing', () => {
    render(<SkipLink targetId="missing" />);
    expect(() => fireEvent.click(screen.getByRole('link'))).not.toThrow();
  });
});
