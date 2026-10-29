import { message } from 'antd';
import { ScreenRegion } from '../../components/ScreenRegion';
import { ScreenScaffold } from '../../components/ScreenScaffold';
import {
  ExportTiersButton,
  ManageTiersDrawer,
  SaveDialog,
  SkuDrawer,
  StagingBar,
  TierFormDialog,
  TierPanel,
  TierRail,
  tierStyles as styles,
  useTierAssortments,
} from '../../features/tier-assortments';
import { screenById } from '../../lib/screens';

const DESCRIPTION =
  'Pick a tier, then tick the SKUs it carries. Every eligible door in the tier receives the result.';

export default function TierAssortmentsPage() {
  const [notify, contextHolder] = message.useMessage();
  const ta = useTierAssortments(notify);
  const ready = ta.status === 'success' && !!ta.data;

  return (
    <ScreenScaffold
      screen={screenById('tier-assortments')}
      description={DESCRIPTION}
      actions={ready ? <ExportTiersButton ta={ta} notify={notify} /> : undefined}
    >
      {contextHolder}
      {ready && ta.tiers.length ? (
        <div
          className={`${styles.layout} ${ta.narrow ? styles.narrow : ''}`}
          data-testid="tiers-region"
        >
          <TierRail ta={ta} />
          <TierPanel ta={ta} />
        </div>
      ) : (
        <ScreenRegion
          label="Tier assortments"
          state={ready ? 'empty' : ta.status === 'error' ? 'error' : 'loading'}
          onRetry={ta.refetch}
          description={
            ready
              ? 'No active tiers yet. Use Manage tiers to add one.'
              : ta.status === 'error'
                ? 'Tier assortments could not be loaded.'
                : undefined
          }
          extra={
            ready ? (
              <button type="button" className={styles.chip} onClick={() => ta.setManageOpen(true)}>
                Manage tiers
              </button>
            ) : undefined
          }
          testId="tiers-region"
        />
      )}
      <StagingBar ta={ta} />
      <SaveDialog ta={ta} notify={notify} />
      <ManageTiersDrawer ta={ta} />
      <TierFormDialog ta={ta} notify={notify} />
      <SkuDrawer ta={ta} />
    </ScreenScaffold>
  );
}
