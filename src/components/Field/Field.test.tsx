import { render, screen } from '@testing-library/react';
import { Input } from 'antd';
import { describe, expect, it } from 'vitest';
import { Field } from '.';

describe('Field', () => {
  it('associates the label, required mark and help with the control', () => {
    render(
      <Field label="New tier" required help="Every door moves.">
        <input />
      </Field>,
    );
    const input = screen.getByLabelText(/New tier/);
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input.getAttribute('aria-describedby')).toMatch(/-help$/);
    expect(screen.getByText('Every door moves.')).toHaveClass('cds-field__help');
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
  });

  it('marks errors and passes status to component controls', () => {
    const { container } = render(
      <Field label="Reason" error="Required" id="reason">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText('Reason');
    expect(input).toHaveAttribute('id', 'reason');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'reason-error');
    expect(screen.getByText('Required')).toHaveClass('cds-field__error');
    expect(container.querySelector('.ant-input-status-error')).toBeInTheDocument();
  });

  it('renders non-element children as is', () => {
    render(<Field label="Plain">text only</Field>);
    expect(screen.getByText('text only')).toBeInTheDocument();
  });
});
