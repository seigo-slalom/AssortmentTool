import { useState } from 'react';
import { Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { today } from '../../lib/clock';
import { plural } from '../../lib/format';
import type { DoorRow } from '../../lib/doors';
import { exportDoors, type ExportKind } from './exportDoors';

export interface ExportButtonProps {
  kind: ExportKind;
  /** Called at click time so the export reflects the grid at that moment. */
  rows: () => readonly DoorRow[];
  label: string;
  icon?: boolean;
  testId?: string;
  notify: ReturnType<typeof message.useMessage>[0];
}

/** Exports the current grid (or the selection) as .xlsx (FR-021–FR-023). */
export function ExportButton({ kind, rows, label, icon, testId, notify }: ExportButtonProps) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const count = await exportDoors(rows(), kind, today());
      notify.success(`Door list exported · ${plural(count, 'door', 'doors')}`);
    } catch {
      notify.error('The door list could not be exported. Try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button
      icon={icon ? <DownloadOutlined aria-hidden /> : undefined}
      loading={busy}
      onClick={run}
      data-testid={testId}
    >
      {label}
    </Button>
  );
}
