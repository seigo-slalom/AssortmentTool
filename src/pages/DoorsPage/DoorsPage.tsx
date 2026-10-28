import { useState } from 'react';
import { Button, message } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { RegionState } from '../../components/RegionState';
import { ScreenRegion } from '../../components/ScreenRegion';
import { ScreenScaffold } from '../../components/ScreenScaffold';
import {
  DoorsFilters,
  DoorsGrid,
  ExportButton,
  SavedFilters,
  SelectionBar,
  TierCell,
  TierChangeDialog,
  useDoorsQuery,
  useDoorsView,
} from '../../features/doors';
import { sortDoors } from '../../lib/doors';
import { plural } from '../../lib/format';
import { screenById } from '../../lib/screens';
import { doorSelection, useDoorSelection } from '../../lib/session';
import styles from './DoorsPage.module.css';

const EMPTY = 'No doors match these filters. Clear a filter to widen the list.';
export const BULK_UPDATE_PATH = '/doors/bulk-update';

export default function DoorsPage() {
  const navigate = useNavigate();
  const [notify, contextHolder] = message.useMessage();
  const { query, update, setMore, clear } = useDoorsQuery();
  const view = useDoorsView(query);
  const [selected, setSelected] = useDoorSelection();
  const [dialog, setDialog] = useState<{ doorId: string; tierId: string } | null>(null);

  const description =
    view.state === 'ready'
      ? `${plural(view.sorted.length, 'door matches', 'doors match')} the current filters. ${
          view.needsTier
            ? `${plural(view.needsTier, 'door needs', 'doors need')} a tier.`
            : 'Every door has a tier.'
        }`
      : undefined;

  // Selected doors in grid order, including ones hidden by the current filters.
  const selectedRows = () =>
    sortDoors(
      view.rows.filter((r) => selected.has(r.id)),
      query.sort,
      query.dir,
    );

  // One primary per screen: with a selection, the selection bar's "Change tier" stands out.
  const actions = (
    <>
      <ExportButton
        kind="filtered"
        rows={() => view.sorted}
        label="Export"
        icon
        testId="doors-export"
        notify={notify}
      />
      <Button
        type={selected.size ? 'default' : 'primary'}
        icon={<SyncOutlined aria-hidden />}
        onClick={() => navigate(BULK_UPDATE_PATH)}
        data-testid="doors-bulk-update"
      >
        Bulk Update
      </Button>
    </>
  );

  return (
    <ScreenScaffold
      screen={screenById('doors')}
      description={description ? <span aria-live="polite">{description}</span> : undefined}
      actions={view.state === 'ready' ? actions : undefined}
    >
      {contextHolder}
      <DoorsFilters
        query={query}
        options={view.options}
        update={update}
        setMore={setMore}
        clear={clear}
      />
      <SavedFilters value={query.saved} onChange={(saved) => update({ saved })} />
      {view.state === 'ready' ? (
        <ScreenRegion
          label={plural(view.sorted.length, 'door', 'doors')}
          visualMask
          testId="doors-region"
        >
          <div className={styles.body}>
            <SelectionBar count={selected.size} onClear={() => doorSelection.clear()}>
              <Button
                type="primary"
                onClick={() =>
                  navigate(BULK_UPDATE_PATH, { state: { type: 'tier', startStep: 1 } })
                }
              >
                Change tier
              </Button>
              <Button
                onClick={() => navigate(BULK_UPDATE_PATH, { state: { type: 'sku', startStep: 1 } })}
              >
                Add exception
              </Button>
              <ExportButton
                kind="selection"
                rows={selectedRows}
                label="Export selection"
                testId="doors-export-selection"
                notify={notify}
              />
            </SelectionBar>
            {view.sorted.length ? (
              <DoorsGrid
                rows={view.sorted}
                query={query}
                onQuery={update}
                selected={selected}
                onSelect={setSelected}
                renderTier={(row) => (
                  <TierCell
                    row={row}
                    tiers={view.data!.index.activeTiers}
                    onPick={(r, tierId) => setDialog({ doorId: r.id, tierId })}
                  />
                )}
              />
            ) : (
              <RegionState state="empty" description={EMPTY} />
            )}
          </div>
        </ScreenRegion>
      ) : (
        <ScreenRegion
          label="Doors"
          state={view.state}
          onRetry={view.refetch}
          description={
            view.state === 'error' ? 'Doors could not be loaded. Your filters are kept.' : undefined
          }
          visualMask
          testId="doors-region"
        />
      )}
      {dialog && view.data ? (
        <TierChangeDialog
          key={`${dialog.doorId}:${dialog.tierId}`}
          data={view.data}
          doorId={dialog.doorId}
          initialTierId={dialog.tierId}
          onClose={() => setDialog(null)}
          notify={notify}
        />
      ) : null}
    </ScreenScaffold>
  );
}
