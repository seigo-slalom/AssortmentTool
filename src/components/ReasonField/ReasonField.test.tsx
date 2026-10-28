import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TIER_REASONS } from '../../lib/doors';
import { ReasonField } from '.';

function Harness() {
  const [value, setValue] = useState('');
  return (
    <ReasonField
      value={value}
      onChange={setValue}
      reasons={TIER_REASONS}
      help="Pick a reason or type your own. Tier-change reasons are not saved."
      placeholder="For example: Q3 review"
    />
  );
}

describe('ReasonField', () => {
  it('labels the required textarea, limits it to 280 characters and shows help', () => {
    render(<Harness />);
    const box = screen.getByLabelText(/Why is this change being made\?/);
    expect(box).toHaveAttribute('maxlength', '280');
    expect(box).toHaveAttribute('aria-required', 'true');
    expect(
      screen.getByText('Pick a reason or type your own. Tier-change reasons are not saved.'),
    ).toBeInTheDocument();
  });

  it('fills the text from a pick and highlights the picked reason', () => {
    render(<Harness />);
    const pick = screen.getByRole('button', { name: 'Retailer request' });
    expect(pick).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(pick);
    expect(screen.getByLabelText(/Why is this change/)).toHaveValue('Retailer request');
    expect(pick).toHaveAttribute('aria-pressed', 'true');
    expect(pick).toHaveClass('ant-btn-primary');
    fireEvent.change(screen.getByLabelText(/Why is this change/), { target: { value: 'Other' } });
    expect(pick).toHaveAttribute('aria-pressed', 'false');
  });
});
