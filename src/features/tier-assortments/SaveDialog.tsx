import { useState } from 'react';
import { Button, Modal } from 'antd';
import { DataGrid, type DataGridColumn } from '../../components/DataGrid';
import { ReasonField } from '../../components/ReasonField';
import { StatusIndicator } from '../../components/StatusIndicator';
import { useInvalidateAssortmentData } from '../../lib/data';
import { fmt, plural, signed } from '../../lib/format';
import { eligibleTierDoors, parseKey, stagedTierCount, withoutKeys } from '../../lib/tiers';
import { px, token } from '../../theme/token';
import { saveStaged } from './saveStaged';
import type { Notify, TierAssortmentsState } from './useTierAssortments';
import styles from './TierAssortments.module.css';

const RULE_REASONS = [
  'New launch',
  'Tier strategy update',
  'Discontinuation',
  'Seasonal display refresh',
] as const;

export function StagingBar({ ta }: { ta: TierAssortmentsState }) {
  const { impact } = ta;
  if (!impact?.changes) return null;
  return (
    <div className={styles.stagingBar} data-testid="tier-staging-bar">
      <span aria-live="polite">
        {plural(impact.changes, 'unsaved change', 'unsaved changes')} across{' '}
        {plural(stagedTierCount(ta.staged), 'tier', 'tiers')} · {signed(impact.doorDelta) || '+0'}{' '}
        door assortments when saved
      </span>
      <div className={styles.filters}>
        <Button onClick={() => ta.setStaged({})}>Discard</Button>
        <Button type="primary" onClick={() => ta.setSaveOpen(true)}>
          Review and save
        </Button>
      </div>
    </div>
  );
}

interface SaveRow {
  key: string;
  sku: string;
  tier: string;
  add: boolean;
  doors: number;
}

const COLUMNS: readonly DataGridColumn<SaveRow>[] = [
  { key: 's', title: 'SKU', dataIndex: 'sku', width: 'wide' },
  { key: 't', title: 'Tier', dataIndex: 'tier', width: 'narrow' },
  {
    key: 'c',
    title: 'Change',
    width: 'narrow',
    truncate: false,
    render: (_, r) => (
      <StatusIndicator tone={r.add ? 'info' : 'warning'} label={r.add ? 'Add' : 'Remove'} />
    ),
  },
  {
    key: 'd',
    title: 'Doors',
    dataIndex: 'doors',
    width: 'narrow',
    align: 'right',
    render: (v) => fmt(Number(v)),
  },
];

export function SaveDialog({ ta, notify }: { ta: TierAssortmentsState; notify: Notify }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const invalidate = useInvalidateAssortmentData();
  const { data, derived, impact, staged } = ta;
  if (!ta.saveOpen || !data || !derived || !impact) return null;

  const rows: SaveRow[] = Object.keys(staged).map((key) => {
    const { skuId, tierId } = parseKey(key);
    const sku = data.index.skuById.get(skuId);
    return {
      key,
      sku: `${sku?.key ?? '—'} · ${sku?.name ?? '—'}`,
      tier: data.index.tierById.get(tierId)?.name ?? '—',
      add: staged[key],
      doors: eligibleTierDoors(derived.doorCounts, tierId, sku),
    };
  });

  const save = async () => {
    setBusy(true);
    const out = await saveStaged(staged, derived.membership);
    await invalidate();
    ta.setStaged((s) => withoutKeys(s, out.saved));
    setBusy(false);
    if (out.failed.length) {
      notify.error(
        `${plural(out.failed.length, 'change', 'changes')} could not be saved (${out.failed[0].error}). They are still staged; try again.`,
      );
      return;
    }
    setReason('');
    ta.setSaveOpen(false);
    notify.success(
      `${plural(out.saved.length, 'change', 'changes')} saved · ${signed(impact.doorDelta) || '+0'} door assortments, shown everywhere straight away.`,
    );
  };

  return (
    <Modal
      open
      title={`Save ${plural(impact.changes, 'tier change', 'tier changes')}`}
      okText="Save changes"
      cancelText="Keep editing"
      okButtonProps={{ disabled: !reason.trim(), loading: busy }}
      onOk={save}
      onCancel={() => ta.setSaveOpen(false)}
      width={px(token.size['dialog-width-tier'])}
    >
      <div className={styles.dialogBody}>
        <span>
          These changes update {fmt(Math.abs(impact.doorDelta))} door assortments right away.
        </span>
        <DataGrid
          rowKey="key"
          columns={COLUMNS}
          dataSource={rows}
          maxHeight="grid-max-height-impact"
          ariaLabel="Staged changes"
        />
        <ReasonField
          value={reason}
          onChange={setReason}
          reasons={RULE_REASONS}
          rows={3}
          placeholder="For example: Sublimage La Crème Fine launch"
          help="Required. Kept for this session only."
        />
      </div>
    </Modal>
  );
}
