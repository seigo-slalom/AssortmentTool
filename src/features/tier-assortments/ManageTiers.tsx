import { useState } from 'react';
import { Button, Drawer, Flex, Input, Modal, Radio, Select } from 'antd';
import { DataGrid, type DataGridColumn } from '../../components/DataGrid';
import { Field } from '../../components/Field';
import { useInvalidateAssortmentData } from '../../lib/data';
import { REASON_MAX_LENGTH } from '../../lib/doors';
import { fmt, plural } from '../../lib/format';
import {
  dropTier,
  isDuplicateName,
  isTierFormValid,
  newTierForm,
  retireAvgDelta,
  TIER_DESCRIPTION_MAX,
  TIER_NAME_MAX,
  tierFormImpact,
  type TierForm,
} from '../../lib/tiers';
import { px, token } from '../../theme/token';
import { saveTierForm } from './saveTierForm';
import type { Notify, TierAssortmentsState } from './useTierAssortments';
import styles from './TierAssortments.module.css';

interface ManageRow {
  key: string;
  id: string;
  rank: string;
  name: string;
  doors: number;
  skus: number;
}

export function ManageTiersDrawer({ ta }: { ta: TierAssortmentsState }) {
  const { tiers, derived } = ta;
  if (!ta.manageOpen || !derived) return null;
  const rows: ManageRow[] = tiers.map((t, i) => {
    const c = derived.skuCounts.get(t.id) ?? { retail: 0, spm: 0 };
    return {
      key: t.id,
      id: t.id,
      rank: String(i + 1).padStart(2, '0'),
      name: t.name,
      doors: derived.doorCounts.get(t.id)?.total ?? 0,
      skus: c.retail + c.spm,
    };
  });
  const columns: readonly DataGridColumn<ManageRow>[] = [
    { key: 'r', title: 'Rank', dataIndex: 'rank', width: 'column-row-number' },
    { key: 'n', title: 'Tier', dataIndex: 'name', width: 'medium' },
    {
      key: 'd',
      title: 'Doors',
      dataIndex: 'doors',
      width: 'column-min',
      align: 'right',
      render: (v) => fmt(Number(v)),
    },
    {
      key: 's',
      title: 'SKUs',
      dataIndex: 'skus',
      width: 'column-min',
      align: 'right',
      render: (v) => fmt(Number(v)),
    },
    {
      key: 'a',
      title: '',
      width: 'column-key',
      truncate: false,
      render: (_, r) => (
        <Flex gap="small">
          <Button
            type="link"
            size="small"
            onClick={() => ta.setTierForm(newTierForm('edit', tiers, r.id))}
          >
            Edit
          </Button>
          {tiers.length > 1 ? (
            <Button
              type="link"
              size="small"
              onClick={() => ta.setTierForm(newTierForm('retire', tiers, r.id))}
            >
              Retire
            </Button>
          ) : null}
        </Flex>
      ),
    },
  ];
  return (
    <Drawer
      open
      title="Manage tiers"
      onClose={() => ta.setManageOpen(false)}
      width={px(token.size['dialog-width-tier'])}
      footer={
        <Flex gap="small" justify="flex-end">
          <Button onClick={() => ta.setManageOpen(false)}>Close</Button>
          <Button type="primary" onClick={() => ta.setTierForm(newTierForm('add', tiers))}>
            Add a tier
          </Button>
        </Flex>
      }
    >
      <div className={styles.dialogBody}>
        <span className={styles.muted}>
          Tiers change rarely, usually at the yearly cluster review. Adding a tier doesn’t move any
          doors; retiring one asks where its doors go first.
        </span>
        <DataGrid
          rowKey="key"
          columns={columns}
          dataSource={rows}
          zebra={false}
          ariaLabel="Tiers"
        />
      </div>
    </Drawer>
  );
}

export function TierFormDialog({ ta, notify }: { ta: TierAssortmentsState; notify: Notify }) {
  const [busy, setBusy] = useState(false);
  const invalidate = useInvalidateAssortmentData();
  const { tierForm: f, tiers, data, derived } = ta;
  if (!f || !data || !derived) return null;

  const set = (p: Partial<TierForm>) => ta.setTierForm({ ...f, ...p });
  const tier = f.tierId ? data.index.tierById.get(f.tierId) : undefined;
  const others = tiers.filter((t) => t.id !== f.tierId);
  const tierDoors = tier ? data.records.doors.filter((d) => d.tierId === tier.id) : [];
  const nDoors = tier ? (derived.doorCounts.get(tier.id)?.total ?? 0) : 0;
  const nameOf = (id: string) => data.index.tierById.get(id)?.name ?? '';
  const sc = tier ? (derived.skuCounts.get(tier.id) ?? { retail: 0, spm: 0 }) : undefined;
  const impact = tierFormImpact(f, {
    tierName: nameOf,
    copyCounts: f.copyFrom ? derived.skuCounts.get(f.copyFrom) : undefined,
    retire: tier
      ? {
          doors: tierDoors.length,
          avgDelta: f.moveTo ? retireAvgDelta(tierDoors, tier.id, f.moveTo, derived.axisCounts) : 0,
          skuAssignments: (sc?.retail ?? 0) + (sc?.spm ?? 0),
        }
      : undefined,
  });
  const ok = isTierFormValid(f, tiers, tierDoors.length);
  const dup = isDuplicateName(f, tiers);
  const title =
    f.mode === 'add'
      ? 'Add a cluster tier'
      : `${f.mode === 'edit' ? 'Edit' : 'Retire'} ${tier?.name ?? 'tier'}`;

  const submit = async () => {
    setBusy(true);
    const result = await saveTierForm(f, data, derived, tiers);
    await invalidate();
    setBusy(false);
    if (!result.ok) {
      notify.error(result.message);
      return;
    }
    if (f.mode === 'retire' && f.tierId) ta.setStaged((s) => dropTier(s, f.tierId!));
    if (result.selectTierId) ta.selectTier(result.selectTierId);
    ta.setTierForm(null);
    notify.success(result.message);
  };

  return (
    <Modal
      open
      title={title}
      okText={f.mode === 'add' ? 'Add tier' : f.mode === 'edit' ? 'Save tier' : 'Retire tier'}
      cancelText="Cancel"
      okButtonProps={{ disabled: !ok, danger: f.mode === 'retire', loading: busy }}
      onOk={submit}
      onCancel={() => ta.setTierForm(null)}
      width={px(token.size['dialog-width-tier'])}
    >
      <div className={styles.dialogBody}>
        {f.mode === 'retire' ? (
          <>
            <span>
              {tier?.name} has {plural(nDoors, 'door', 'doors')}.{' '}
              {tierDoors.length
                ? 'Every door needs a tier, so move them to another tier first.'
                : 'Nothing depends on it.'}
            </span>
            {tierDoors.length ? (
              <Field
                label="Move its doors to"
                required
                help="Each door then receives that tier’s SKUs."
              >
                <Select
                  value={f.moveTo ?? undefined}
                  placeholder="Choose a tier"
                  options={others.map((t) => ({
                    value: t.id,
                    label: `${t.name} · ${plural(derived.doorCounts.get(t.id)?.total ?? 0, 'door', 'doors')}`,
                  }))}
                  onChange={(v: string) => set({ moveTo: v })}
                />
              </Field>
            ) : null}
          </>
        ) : (
          <>
            <Field
              label="Tier name"
              required
              error={dup ? 'A tier with this name already exists.' : null}
              help="Shown on doors, filters and exports."
            >
              <Input
                value={f.name}
                maxLength={TIER_NAME_MAX}
                placeholder="For example: Prestige"
                onChange={(e) => set({ name: e.target.value })}
              />
            </Field>
            <Field label="Description">
              <Input.TextArea
                value={f.description}
                rows={2}
                maxLength={TIER_DESCRIPTION_MAX}
                placeholder="For example: Flagship doors with the full fragrance wall"
                onChange={(e) => set({ description: e.target.value })}
              />
            </Field>
            <Field
              label="Position in the ranking"
              required
              help="Higher tiers usually receive more SKUs. The order is used in lists, charts and exports."
            >
              <Select
                value={f.after}
                options={[
                  { value: '', label: 'First (entry level)' },
                  ...others.map((t) => ({ value: t.id, label: `After ${t.name}` })),
                ]}
                onChange={(v: string) => set({ after: v })}
              />
            </Field>
            {f.mode === 'add' ? (
              <Field label="Starting SKUs" required>
                <Radio.Group value={f.start} onChange={(e) => set({ start: e.target.value })}>
                  <Flex vertical gap="small">
                    <Radio value="copy">
                      <Flex gap="small" align="center" wrap>
                        Copy from
                        <Select
                          size="small"
                          className={styles.types}
                          value={f.copyFrom ?? undefined}
                          options={tiers.map((t) => ({ value: t.id, label: t.name }))}
                          onChange={(v: string) => set({ copyFrom: v, start: 'copy' })}
                          aria-label="Copy SKUs from tier"
                        />
                      </Flex>
                    </Radio>
                    <Radio value="empty">Start empty</Radio>
                  </Flex>
                </Radio.Group>
              </Field>
            ) : null}
          </>
        )}
        <div className={styles.impactBox}>
          <span>What happens</span>
          {impact.map((text) => (
            <span key={text}>{text}</span>
          ))}
        </div>
        <Field label="Why is this change being made?" required help="Kept for this session only.">
          <Input.TextArea
            value={f.reason}
            rows={2}
            maxLength={REASON_MAX_LENGTH}
            placeholder="For example: 2027 cluster strategy"
            onChange={(e) => set({ reason: e.target.value })}
          />
        </Field>
      </div>
    </Modal>
  );
}
