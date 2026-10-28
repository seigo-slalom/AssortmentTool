import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KpiRow, KpiTile } from '.';

describe('KpiTile', () => {
  it('shows label, value and a status', () => {
    render(
      <KpiRow>
        <KpiTile label="Rows left out" value="3" status={{ tone: 'critical', label: '2 errors' }} />
      </KpiRow>,
    );
    expect(screen.getByText('Rows left out')).toHaveClass('cds-kpi__label');
    expect(screen.getByText('3')).toHaveClass('cds-kpi__value');
    expect(screen.getByText('2 errors')).toBeInTheDocument();
  });

  it.each([null, undefined, '', Number.NaN])('shows a dash when the value is %s', (value) => {
    const { container } = render(<KpiTile label="Doors changing" value={value} />);
    expect(screen.getByRole('img', { name: 'Unavailable' })).toHaveTextContent('—');
    expect(container.querySelector('.spacer')).toBeInTheDocument();
  });

  it('keeps zero as a value', () => {
    render(<KpiTile label="Doors" value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
