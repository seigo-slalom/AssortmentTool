import { useMemo, type ReactNode } from 'react';
import { Descriptions, Drawer } from 'antd';
import { DataGrid, type DataGridColumn } from '../../components/DataGrid';
import { StatusIndicator } from '../../components/StatusIndicator';
import { fmt } from '../../lib/format';
import { isActiveTieredDoor, skuTypeLabel } from '../../lib/tiers';
import { px, token } from '../../theme/token';
import type { TierAssortmentsState } from './useTierAssortments';
import styles from './TierAssortments.module.css';

interface ReachRow {
  key: string;
  tier: string;
  b: number;
  e: number;
}
interface ExcRow {
  key: string;
  target: string;
  add: boolean;
  reason: string;
}

const REACH: readonly DataGridColumn<ReachRow>[] = [
  { key: 't', title: 'Tier', dataIndex: 'tier', width: 'medium' },
  {
    key: 'b',
    title: 'Brick & Mortar',
    dataIndex: 'b',
    width: 'medium',
    align: 'right',
    render: (v) => fmt(Number(v)),
  },
  {
    key: 'e',
    title: 'E-business',
    dataIndex: 'e',
    width: 'narrow',
    align: 'right',
    render: (v) => fmt(Number(v)),
  },
];
const EXC: readonly DataGridColumn<ExcRow>[] = [
  { key: 'a', title: 'Applies to', dataIndex: 'target', width: 'wide' },
  {
    key: 'ac',
    title: 'Action',
    width: 'narrow',
    truncate: false,
    render: (_, x) => (
      <StatusIndicator tone={x.add ? 'info' : 'neutral'} label={x.add ? 'Added' : 'Removed'} />
    ),
  },
  { key: 'r', title: 'Reason', dataIndex: 'reason', width: 'wide' },
];

export function SkuDrawer({ ta }: { ta: TierAssortmentsState }) {
  const { data, derived, skuId, tiers } = ta;
  const sku = skuId ? data?.index.skuById.get(skuId) : undefined;

  const reach = useMemo<ReachRow[]>(() => {
    if (!data || !sku) return [];
    const rows = new Map(tiers.map((t) => [t.id, { key: t.id, tier: t.name, b: 0, e: 0 }]));
    for (const door of data.records.doors) {
      const row = rows.get(door.tierId ?? '');
      if (!row || !isActiveTieredDoor(door)) continue;
      const lookup = data.engine.getDoorAssortment(door.id);
      if (!lookup.found || !lookup.assortment.skuIds.includes(sku.id)) continue;
      if (door.onlineOffline?.toLowerCase() === 'online') row.e += 1;
      else row.b += 1;
    }
    return [...rows.values()];
  }, [data, sku, tiers]);

  if (!data || !derived || !sku) return null;

  const exceptions: ExcRow[] = data.records.exceptions
    .filter((e) => e.skuId === sku.id)
    .map((e) => ({
      key: e.id,
      target:
        e.level === 'door'
          ? (data.index.doorById.get(e.doorId ?? '')?.name ?? '—')
          : `${e.distributorNameCode ?? '—'} (all doors)`,
      add: e.action === 'add',
      reason: e.reason ?? '',
    }));
  const inTiers = tiers.filter((t) => derived.membership.bySku.get(sku.id)?.has(t.id));
  const items: [string, ReactNode][] = [
    ['SKU key', sku.key ?? '—'],
    ['SKU name', sku.name ?? '—'],
    ['Barcode', sku.barcode ?? '—'],
    ['Master product name', sku.masterProductName ?? '—'],
    ['Master product baseline', sku.masterProductBaseline ?? '—'],
    ['Axis', sku.axis ? `${sku.axis} · doors with product line ${sku.axis}` : '—'],
    ['Master franchise', sku.masterFranchise ?? '—'],
    ['Franchise', sku.franchise ?? '—'],
    ['Line', sku.line ?? '—'],
    ['Product master category', sku.masterCategory ?? '—'],
    ['Product category', sku.category ?? '—'],
    ['Product subcategory', sku.subcategory ?? '—'],
    ['SKU type (calculated)', skuTypeLabel(sku.type)],
    [
      'Tier rules',
      inTiers.length ? (
        inTiers.map((t) => t.name).join(', ')
      ) : (
        <StatusIndicator tone="warning" label="Not yet assorted" />
      ),
    ],
    ['Last seen in the Sunrise Dataflow', sku.lastSeenInSunrise ?? '—'],
  ];

  return (
    <Drawer
      open
      title={sku.name ?? sku.key}
      onClose={() => ta.setSkuId(null)}
      width={px(token.size['dialog-width-tier'])}
    >
      <div className={styles.drawerBody}>
        <Descriptions
          bordered
          size="small"
          column={1}
          items={items.map(([label, children], i) => ({ key: `k${i}`, label, children }))}
        />
        <div className={styles.stack}>
          <h3 className={styles.sectionTitle}>Where it’s distributed</h3>
          <DataGrid
            rowKey="key"
            columns={REACH}
            dataSource={reach}
            ariaLabel="Where it’s distributed"
          />
        </div>
        <div className={styles.stack}>
          <h3 className={styles.sectionTitle}>Exceptions</h3>
          <DataGrid
            rowKey="key"
            columns={EXC}
            dataSource={exceptions}
            maxHeight="grid-max-height-impact"
            emptyText="No exceptions for this SKU."
            ariaLabel="Exceptions"
          />
        </div>
      </div>
    </Drawer>
  );
}
