import { useState } from 'react';
import { Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { formatIsoDate, today } from '../../lib/clock';
import { downloadWorkbook } from '../../lib/excel';
import { plural } from '../../lib/format';
import { tierAssortmentSheet } from '../../lib/tiers';
import type { Notify, TierAssortmentsState } from './useTierAssortments';

/** Exports every SKU × active tier as .xlsx (spec US6). */
export function ExportTiersButton({ ta, notify }: { ta: TierAssortmentsState; notify: Notify }) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (!ta.data || !ta.derived) return;
    setBusy(true);
    try {
      const skus = ta.data.records.skus;
      await downloadWorkbook(`Tier_assortments_${formatIsoDate(today())}.xlsx`, [
        tierAssortmentSheet(skus, ta.tiers, ta.derived.membership),
      ]);
      notify.success(
        `Tier assortments exported · ${plural(skus.length, 'SKU', 'SKUs')} × ${plural(ta.tiers.length, 'tier', 'tiers')}`,
      );
    } catch {
      notify.error('The tier assortments could not be exported. Try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button
      icon={<DownloadOutlined aria-hidden />}
      loading={busy}
      onClick={run}
      data-testid="tiers-export"
    >
      Export
    </Button>
  );
}
