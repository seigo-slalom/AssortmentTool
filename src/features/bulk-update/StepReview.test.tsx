import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StepReview } from './StepReview';
import type { Impact } from './types';

const impact: Impact = {
  rows: [],
  doorsChanging: 0,
  avgNetDelta: -2,
  exceptionsCreated: 0,
  skuChanges: 0,
  rowsLeftOut: 2,
  sentence: 'Nothing.',
};

describe('StepReview', () => {
  it('flags left-out rows with errors and shows a negative average', () => {
    render(
      <StepReview
        type="tier"
        impact={impact}
        errors={2}
        reason=""
        onReason={vi.fn()}
        onBack={vi.fn()}
        onApply={vi.fn()}
        busy={false}
        headingRef={null}
      />,
    );
    const tiles = screen.getAllByTestId('kpi-tile');
    expect(tiles[1]).toHaveTextContent('−2');
    expect(tiles[3]).toHaveTextContent('2 errors');
  });
});
