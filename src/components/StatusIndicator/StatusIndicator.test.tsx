import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusIndicator, type StatusIndicatorTone } from '.';

const TONES: [StatusIndicatorTone, string][] = [
  ['critical', 'close-circle'],
  ['error', 'exclamation-circle'],
  ['warning', 'warning'],
  ['success', 'check-circle'],
  ['info', 'info-circle'],
  ['neutral', 'clock-circle'],
  ['unavailable', 'minus-circle'],
];

describe('StatusIndicator', () => {
  it.each(TONES)('%s tone renders its icon, tone class and visible label', (tone, icon) => {
    const { container } = render(<StatusIndicator tone={tone} label="Ready" />);
    const root = container.firstElementChild!;
    expect(root).toHaveClass('cds-status', `cds-status--${tone}`, tone);
    expect(root).toHaveAttribute('data-tone', tone);
    expect(container.querySelector(`.anticon-${icon}`)).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Ready')).toHaveClass('cds-status__label');
  });

  it('iconOnly keeps the label for assistive technology only', () => {
    render(<StatusIndicator tone="warning" label="Needs tier" iconOnly />);
    expect(screen.getByText('Needs tier')).toHaveClass('cds-sr-only');
  });
});
