import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RegionState } from './RegionState';

describe('RegionState', () => {
  it('renders a busy loading skeleton with the requested rows', () => {
    const { container } = render(<RegionState state="loading" rows={2} />);
    const region = screen.getByRole('region', { name: 'Loading content' });
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(region).toHaveClass('cds-state');
    expect(container.querySelectorAll('.ant-skeleton-paragraph li')).toHaveLength(2);
  });

  it('defaults to four skeleton rows and can show a loading message', () => {
    const { container } = render(<RegionState state="loading" description="Connecting…" />);
    expect(container.querySelectorAll('.ant-skeleton-paragraph li')).toHaveLength(4);
    expect(screen.getByText('Connecting…')).toBeInTheDocument();
  });

  it('renders the empty state with a default or custom description', () => {
    const { rerender } = render(<RegionState state="empty" />);
    expect(screen.getByRole('region', { name: 'No results' })).toBeInTheDocument();
    expect(screen.getByText('Nothing to show yet.')).toBeInTheDocument();
    rerender(<RegionState state="empty" description="No doors match." />);
    expect(screen.getByText('No doors match.')).toBeInTheDocument();
  });

  it('renders the error state with defaults and no retry button', () => {
    render(<RegionState state="error" />);
    expect(screen.getByRole('region', { name: 'Content unavailable' })).toBeInTheDocument();
    expect(
      screen.getByText('Content unavailable', { selector: '.ant-result-title' }),
    ).toBeVisible();
    expect(
      screen.getByText('The content could not be loaded. Try again without losing your place.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('renders a custom error with a working retry button', () => {
    const onRetry = vi.fn();
    render(
      <RegionState state="error" title="Host down" description="Try later" onRetry={onRetry} />,
    );
    expect(screen.getByText('Host down')).toBeInTheDocument();
    expect(screen.getByText('Try later')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders a visibly labeled placeholder with title and description', () => {
    render(<RegionState state="placeholder" title="Doors" description="Arrives later." />);
    const region = screen.getByRole('region', { name: 'Coming in a later spec' });
    expect(region).toHaveClass('cds-state', 'placeholder');
    expect(screen.getByText('Coming in a later spec')).toHaveClass('cds-prominent-label');
    expect(screen.getByText('Doors')).toBeInTheDocument();
    expect(screen.getByText('Arrives later.')).toBeInTheDocument();
  });

  it('renders a bare placeholder label', () => {
    const { container } = render(<RegionState state="placeholder" />);
    expect(container.querySelector('.placeholderTitle')).toBeNull();
    expect(container.querySelector('.placeholderText')).toBeNull();
  });
});
