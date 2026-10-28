import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StepCheckRows } from './StepCheckRows';
import type { CheckedRow, RowStatus } from './types';

const row = (i: number, status: RowStatus): CheckedRow => ({
  key: `r${i}`,
  line: i + 2,
  doorKey: `US${i}`,
  doorLabel: `Door ${i}`,
  change: 'Access → Premium',
  status,
  message: status === 'ready' ? '' : 'Because.',
});

const renderStep = (
  rows: CheckedRow[],
  source: 'upload' | 'filter' = 'filter',
  view: 'all' | 'issues' = 'all',
) => {
  const props = {
    onView: vi.fn(),
    onDownloadIssues: vi.fn(),
    onBack: vi.fn(),
    onReview: vi.fn(),
  };
  render(<StepCheckRows rows={rows} view={view} source={source} headingRef={null} {...props} />);
  return props;
};

describe('StepCheckRows', () => {
  it('uses singular labels and the non-upload advice for errors', () => {
    renderStep([row(0, 'warning'), row(1, 'error'), row(2, 'ready')]);
    expect(screen.getByTestId('bulk-counts')).toHaveTextContent('1 ready1 warning1 error');
    expect(screen.getByTestId('bulk-left-out')).toHaveTextContent(
      '1 row has an error. Continue without them, or go back and change your choice.',
    );
  });

  it('hides the download and left-out panel when every row is ready, and pages long lists', () => {
    const props = renderStep(Array.from({ length: 120 }, (_, i) => row(i, 'ready')));
    expect(
      screen.queryByRole('button', { name: 'Download rows that need attention' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('bulk-left-out')).not.toBeInTheDocument();
    expect(screen.getByTestId('bulk-rows').querySelectorAll('tbody tr[data-row-key]')).toHaveLength(
      100,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Review impact (120 rows)' }));
    expect(props.onReview).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(props.onBack).toHaveBeenCalled();
  });

  it('shows only rows that need attention and downloads them', () => {
    const props = renderStep([row(0, 'ready'), row(1, 'skipped')], 'upload', 'issues');
    expect(screen.getByTestId('bulk-rows').querySelectorAll('tbody tr[data-row-key]')).toHaveLength(
      1,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Download rows that need attention' }));
    expect(props.onDownloadIssues).toHaveBeenCalledWith([expect.objectContaining({ key: 'r1' })]);
    fireEvent.click(screen.getByText('All rows (2)'));
    expect(props.onView).toHaveBeenCalledWith('all');
  });
});
