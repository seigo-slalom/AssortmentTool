import type { ReactNode } from 'react';
import { Button, Popconfirm } from 'antd';

export interface ConfirmActionProps {
  label: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  danger?: boolean;
  disabled?: boolean;
  testId?: string;
}

/** Button that asks for confirmation first (port of the prototype's ChanelUI ConfirmAction). */
export function ConfirmAction({
  label,
  title,
  description,
  confirmLabel,
  onConfirm,
  danger = false,
  disabled = false,
  testId,
}: ConfirmActionProps) {
  return (
    <Popconfirm
      title={title}
      description={description}
      okText={confirmLabel}
      cancelText="Cancel"
      okButtonProps={{ danger }}
      onConfirm={onConfirm}
      disabled={disabled}
      rootClassName="cds-overlay-root"
    >
      <Button danger={danger} disabled={disabled} data-testid={testId}>
        {label}
      </Button>
    </Popconfirm>
  );
}
