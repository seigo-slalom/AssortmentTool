import { Button, Checkbox } from 'antd';
import { StatusIndicator } from '../../components/StatusIndicator';
import { fmt, plural } from '../../lib/format';
import type { ProductGroup, SkuRow } from '../../lib/tiers';
import type { TierAssortmentsState } from './useTierAssortments';
import styles from './TierAssortments.module.css';

function SkuLine({
  ta,
  row,
  tierName,
}: {
  ta: TierAssortmentsState;
  row: SkuRow;
  tierName: string;
}) {
  const name = row.sku.name ?? row.sku.key ?? 'SKU';
  return (
    <div className={`${styles.row} ${styles.skuRow}`}>
      <Checkbox
        checked={row.checked}
        onChange={(e) => ta.stageRow(row.sku.id, e.target.checked)}
        aria-label={`${row.checked ? 'Remove' : 'Add'} ${name} ${row.checked ? 'from' : 'to'} ${tierName}`}
      />
      <span className={styles.stack}>
        <button
          type="button"
          className={styles.skuName}
          title={row.label}
          onClick={() => ta.setSkuId(row.sku.id)}
        >
          {row.label}
        </button>
        <span className={`${styles.small} ${styles.muted}`}>{row.sub}</span>
      </span>
      <span className={styles.small}>{row.also}</span>
      <span className={styles.flags}>
        {row.isNew ? <StatusIndicator tone="info" label="New · in no tier" /> : null}
      </span>
      <span className={styles.right}>
        {row.staged ? (
          <StatusIndicator
            tone={row.staged === 'add' ? 'info' : 'warning'}
            label={row.staged === 'add' ? 'Adding' : 'Removing'}
          />
        ) : null}
      </span>
    </div>
  );
}

function GroupBlock({
  ta,
  g,
  tierName,
}: {
  ta: TierAssortmentsState;
  g: ProductGroup;
  tierName: string;
}) {
  const open = ta.isOpen(g.key);
  return (
    <div className={styles.group}>
      <div className={`${styles.row} ${styles.groupRow} ${g.stagedCount ? styles.staged : ''}`}>
        <Checkbox
          checked={g.checked}
          indeterminate={g.indeterminate}
          disabled={g.disabled}
          onChange={() => ta.stageGroup(g)}
          aria-label={`${g.add ? 'Add every' : 'Remove every'} ${g.name} SKU ${g.add ? 'to' : 'from'} ${tierName}`}
        />
        <span className={styles.stack}>
          <span>{g.name}</span>
          <span className={`${styles.small} ${styles.muted}`}>{g.sub}</span>
        </span>
        <span className={styles.stack}>
          <span className={styles.small}>
            {fmt(g.inCount)} of {fmt(g.total)}
          </span>
          <span aria-hidden className={styles.bar}>
            <span className={styles.barFill} style={{ width: `${g.pct}%` }} />
          </span>
        </span>
        <span className={styles.flags}>
          {g.stagedCount ? (
            <StatusIndicator
              tone="info"
              label={plural(g.stagedCount, 'unsaved change', 'unsaved changes')}
            />
          ) : null}
          {g.newCount ? <StatusIndicator tone="info" label={`${fmt(g.newCount)} new`} /> : null}
        </span>
        <span className={styles.right}>
          <Button
            type="link"
            size="small"
            aria-expanded={open}
            onClick={() => ta.toggleGroup(g.key)}
          >
            {open ? 'Hide' : `Show ${fmt(g.total)}`}
          </Button>
        </span>
      </div>
      {open ? (
        <div className={styles.skuRows}>
          {g.rows.map((row) => (
            <SkuLine key={row.sku.id} ta={ta} row={row} tierName={tierName} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function GroupList({ ta }: { ta: TierAssortmentsState }) {
  const tierName = ta.tier?.name ?? '';
  const groups = ta.view?.groups ?? [];
  const empty =
    ta.show === 'in'
      ? `No SKUs in ${tierName} match these filters.`
      : ta.show === 'out'
        ? `Every SKU that matches these filters is already in ${tierName}.`
        : 'No SKUs match these filters. Clear a filter to widen the list.';
  return (
    <div className={styles.list} data-testid="tier-groups">
      <div className={`${styles.row} ${styles.head}`}>
        <span />
        <span>Product group</span>
        <span>In {tierName}</span>
        <span>Flags</span>
        <span className={styles.right}>SKUs</span>
      </div>
      {groups.length ? null : <div className={styles.empty}>{empty}</div>}
      {groups.map((g) => (
        <GroupBlock key={g.key} ta={ta} g={g} tierName={tierName} />
      ))}
    </div>
  );
}
