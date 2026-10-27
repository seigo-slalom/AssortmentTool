import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmAction } from '.';

describe('ConfirmAction', () => {
  it('confirms before running the action', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmAction
        label="Undo this update"
        title="Undo this bulk update?"
        description="Every change from this update is reversed."
        confirmLabel="Undo update"
        onConfirm={onConfirm}
        testId="undo"
      />,
    );
    fireEvent.click(screen.getByTestId('undo'));
    expect(await screen.findByText('Undo this bulk update?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Undo update' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('cancelling does nothing; disabled cannot open', async () => {
    const onConfirm = vi.fn();
    const { rerender } = render(
      <ConfirmAction
        label="Delete"
        title="Delete?"
        description="Gone."
        confirmLabel="Delete it"
        onConfirm={onConfirm}
        danger
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(onConfirm).not.toHaveBeenCalled();
    rerender(
      <ConfirmAction
        label="Delete"
        title="Delete?"
        description="Gone."
        confirmLabel="Delete it"
        onConfirm={onConfirm}
        disabled
      />,
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });
});
