import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormActions } from '.';

describe('FormActions', () => {
  it('wraps its buttons in the actions row', () => {
    render(
      <FormActions>
        <button type="button">Back</button>
      </FormActions>,
    );
    expect(screen.getByRole('button', { name: 'Back' }).parentElement).toHaveClass(
      'cds-form-actions',
    );
  });
});
