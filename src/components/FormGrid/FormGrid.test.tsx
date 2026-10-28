import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormGrid } from '.';

describe('FormGrid', () => {
  it('defaults to two columns and supports one', () => {
    const { container, rerender } = render(
      <FormGrid>
        <span>a</span>
      </FormGrid>,
    );
    expect(container.querySelector('.cds-form-grid')).toHaveClass('cds-form-grid--2', 'c2');
    rerender(
      <FormGrid columns={1}>
        <span>a</span>
      </FormGrid>,
    );
    expect(container.querySelector('.cds-form-grid')).toHaveClass('c1');
    expect(screen.getByText('a')).toBeInTheDocument();
  });
});
