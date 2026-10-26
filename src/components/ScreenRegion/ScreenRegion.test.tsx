import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ScreenRegion } from './ScreenRegion';

describe('ScreenRegion', () => {
  it('labels the section with an h5 title', () => {
    render(<ScreenRegion label="Doors by tier" />);
    const region = screen.getByRole('region', { name: 'Doors by tier' });
    expect(screen.getByRole('heading', { level: 5, name: 'Doors by tier' })).toBeInTheDocument();
    expect(region.querySelector('.cds-region')).not.toBeNull();
  });

  it('renders children instead of a state', () => {
    render(
      <ScreenRegion label="Region" extra={<span>extra slot</span>}>
        <p>content</p>
      </ScreenRegion>,
    );
    expect(screen.getByText('content')).toBeInTheDocument();
    expect(screen.getByText('extra slot')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'No results' })).not.toBeInTheDocument();
  });

  it('defaults to the empty state with the description', () => {
    render(<ScreenRegion label="Region" description="Nothing yet" />);
    expect(screen.getByRole('region', { name: 'No results' })).toBeInTheDocument();
    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
  });

  it('forwards state and retry to RegionState', () => {
    const onRetry = vi.fn();
    render(<ScreenRegion label="Region" state="error" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('marks data-bearing regions for visual masking and accepts a test id', () => {
    const { rerender } = render(<ScreenRegion label="Region" visualMask testId="region" />);
    expect(screen.getByTestId('region')).toHaveAttribute('data-visual-mask', '');
    rerender(<ScreenRegion label="Region" testId="region" />);
    expect(screen.getByTestId('region')).not.toHaveAttribute('data-visual-mask');
  });
});
