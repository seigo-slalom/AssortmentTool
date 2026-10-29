import { Button, Input, Segmented, Select, Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { StatusIndicator } from '../../components/StatusIndicator';
import type { SkuType } from '../../lib/data';
import { fmt, plural } from '../../lib/format';
import { newTierForm, type ShowMode } from '../../lib/tiers';
import { GroupList } from './GroupList';
import type { TierAssortmentsState } from './useTierAssortments';
import styles from './TierAssortments.module.css';

/** "Needs attention" chip and focus tag (spec US3). */
function AttentionRow({ ta }: { ta: TierAssortmentsState }) {
  const fresh = ta.data?.records.skus.filter((k) => ta.derived?.isNew(k.id)).length ?? 0;
  return (
    <div className={styles.attention}>
      {fresh ? (
        <>
          <span className={`${styles.small} ${styles.muted}`}>Needs attention</span>
          <button
            type="button"
            className={styles.chip}
            aria-pressed={ta.focus === 'fresh'}
            onClick={ta.toggleFocus}
          >
            <StatusIndicator
              tone="info"
              label={`${plural(fresh, 'new SKU', 'new SKUs')} from Sunrise in no tier yet`}
            />
          </button>
        </>
      ) : null}
      {ta.focus ? (
        <Tag closable onClose={ta.clearFocus}>
          Showing: New SKUs in no tier yet
        </Tag>
      ) : null}
      <span className={styles.push}>
        <Button type="link" size="small" onClick={ta.toggleAll}>
          {ta.allOpen ? 'Collapse all' : 'Expand all'}
        </Button>
      </span>
    </div>
  );
}

export function TierPanel({ ta }: { ta: TierAssortmentsState }) {
  const { tier, derived, view } = ta;
  if (!tier || !derived || !view) return null;
  const c = derived.skuCounts.get(tier.id) ?? { retail: 0, spm: 0 };
  const doors = derived.doorCounts.get(tier.id)?.total ?? 0;
  const line = `${tier.description ? `${tier.description} · ` : ''}${plural(doors, 'door', 'doors')} · ${fmt(c.retail)} retail and ${fmt(c.spm)} SPM SKUs`;
  return (
    <section aria-labelledby="as-tier-title" className={styles.panel}>
      <div className={styles.panelHead}>
        <div className={styles.titleLine}>
          <h2 id="as-tier-title" className={styles.title}>
            {tier.name}
          </h2>
          <span className={styles.muted}>{line}</span>
        </div>
        <Button
          icon={<EditOutlined aria-hidden />}
          onClick={() => ta.setTierForm(newTierForm('edit', ta.tiers, tier.id))}
        >
          Edit tier
        </Button>
      </div>
      <div className={styles.filters}>
        <Input.Search
          className={styles.search}
          allowClear
          placeholder="Search SKU or product group"
          aria-label="Search SKU or product group"
          value={ta.search}
          onChange={(e) => ta.setSearch(e.target.value)}
        />
        <Select
          className={styles.axis}
          allowClear
          placeholder="All axes"
          aria-label="Axis"
          value={ta.axis}
          options={derived.axes.map((a) => ({ value: a, label: a }))}
          onChange={(v?: string) => ta.setAxis(v)}
        />
        <Select
          className={styles.types}
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="Retail and SPM"
          aria-label="SKU type"
          value={ta.types}
          options={[
            { value: 'retail', label: 'Retail' },
            { value: 'spm', label: 'SPM' },
          ]}
          onChange={(v: SkuType[]) => ta.setTypes(v)}
        />
        <div className={styles.segmented}>
          <Segmented<ShowMode>
            aria-label="Which SKUs to show"
            value={ta.show}
            onChange={ta.setShow}
            options={[
              { value: 'all', label: `All (${fmt(view.counts.all)})` },
              { value: 'in', label: `In tier (${fmt(view.counts.in)})` },
              { value: 'out', label: `Not in tier (${fmt(view.counts.out)})` },
            ]}
          />
        </div>
      </div>
      <AttentionRow ta={ta} />
      <GroupList ta={ta} />
      <span className={styles.muted}>
        {plural(view.groups.length, 'product group', 'product groups')} ·{' '}
        {plural(view.visible.length, 'SKU', 'SKUs')} shown. A door receives a SKU only when the
        SKU’s Axis matches the door’s Product line; any door-level conflict shows on the door and is
        resolved with an exception.
      </span>
    </section>
  );
}
