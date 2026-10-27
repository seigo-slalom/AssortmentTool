import type { SyntheticEvent } from 'react';
import { Select } from 'antd';
import { StatusIndicator } from '../../components/StatusIndicator';
import type { TierRecord } from '../../lib/data';
import { tierText, type DoorRow } from '../../lib/doors';
import styles from './TierCell.module.css';

export interface TierCellProps {
  row: DoorRow;
  tiers: readonly TierRecord[];
  /** Opens the confirmation dialog; the cell keeps the saved tier until then. */
  onPick: (row: DoorRow, tierId: string) => void;
}

const stop = (event: SyntheticEvent) => event.stopPropagation();

/** Inline tier picker for open doors; read-only text for closed doors (FR-024). */
export function TierCell({ row, tiers, onPick }: TierCellProps) {
  if (row.isClosed) return <>{tierText(row)}</>;
  return (
    <span className={styles.cell} onClick={stop} onKeyDown={stop}>
      {row.tierName ? null : <StatusIndicator tone="warning" label="Needs tier" iconOnly />}
      <Select
        size="small"
        className={styles.select}
        value={row.tierName ? row.tierId : undefined}
        placeholder="Assign tier"
        aria-label={`Tier for ${row.name}`}
        options={tiers.map((t) => ({ value: t.id, label: t.name }))}
        onChange={(tierId: string) => onPick(row, tierId)}
        popupMatchSelectWidth={false}
      />
    </span>
  );
}
