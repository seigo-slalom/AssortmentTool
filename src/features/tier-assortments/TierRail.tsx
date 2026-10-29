import { Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { fmt, plural } from '../../lib/format';
import type { TierAssortmentsState } from './useTierAssortments';
import styles from './TierAssortments.module.css';

export function TierRail({ ta }: { ta: TierAssortmentsState }) {
  const { tiers, derived } = ta;
  return (
    <nav aria-label="Cluster tiers" className={styles.rail}>
      <span className={styles.railLabel}>Tiers · {tiers.length}</span>
      {tiers.map((t, i) => {
        const c = derived?.skuCounts.get(t.id) ?? { retail: 0, spm: 0 };
        const doors = derived?.doorCounts.get(t.id)?.total ?? 0;
        const n = ta.stagedFor(t.id);
        return (
          <button
            key={t.id}
            type="button"
            className={styles.railItem}
            aria-current={t.id === ta.tierId ? 'true' : undefined}
            onClick={() => ta.selectTier(t.id)}
          >
            <span className={styles.railTop}>
              <span className={styles.railName}>{t.name}</span>
              <span className={styles.small}>{String(i + 1).padStart(2, '0')}</span>
            </span>
            <span className={styles.small}>
              {plural(doors, 'door', 'doors')} · {fmt(c.retail + c.spm)} SKUs
            </span>
            {n > 0 ? (
              <span className={styles.small}>
                ● {plural(n, 'unsaved change', 'unsaved changes')}
              </span>
            ) : null}
          </button>
        );
      })}
      <div className={styles.railFooter}>
        <Button
          type="text"
          block
          icon={<SettingOutlined aria-hidden />}
          onClick={() => ta.setManageOpen(true)}
        >
          Manage tiers
        </Button>
      </div>
    </nav>
  );
}
