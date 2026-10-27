import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { today } from '../../lib/clock';
import {
  buildDoorRows,
  BULK_SAVED_FILTERS,
  matchesSavedFilter,
  type SavedFilterId,
} from '../../lib/doors';
import { useInvalidateAssortmentData, type AssortmentData } from '../../lib/data';
import {
  bulkIntroHidden,
  doorSelection,
  doorsPath,
  useBulkIntroHidden,
  useLastDoorsSearch,
} from '../../lib/session';
import {
  applyBulk,
  DEFAULT_DEPS,
  retryFailed,
  undoBulk,
  type BulkDeps,
  type Progress,
} from './applyBulk';
import { BulkIntro } from './BulkIntro';
import { applicableRows, bulkReducer, canCheck, initialBulkState } from './bulkReducer';
import { BulkResult } from './BulkResult';
import { BulkSteps } from './BulkSteps';
import { checkRows } from './checkRows';
import { computeImpact } from './impact';
import { buildRawRows, scopeDoors } from './rawRows';
import { StepCheckRows } from './StepCheckRows';
import { StepChooseChange } from './StepChooseChange';
import { StepChooseDoors } from './StepChooseDoors';
import { StepReview } from './StepReview';
import { downloadIssues } from './templates';
import type { BulkIntent, BulkResult as Outcome } from './types';
import styles from './BulkUpdate.module.css';

export interface BulkUpdateWorkflowProps {
  data: AssortmentData;
  /** Tells the page when the result screen is showing (header description changes). */
  onDoneChange: (done: boolean) => void;
  deps?: BulkDeps;
}

/** The four-step Bulk Update workflow (prototype `vMass`). Nothing is written before Apply. */
export function BulkUpdateWorkflow({
  data,
  onDoneChange,
  deps = DEFAULT_DEPS,
}: BulkUpdateWorkflowProps) {
  const navigate = useNavigate();
  const { state: routerState } = useLocation();
  const [notify, contextHolder] = message.useMessage();
  const [state, dispatch] = useReducer(bulkReducer, undefined, () =>
    initialBulkState((routerState ?? undefined) as BulkIntent | undefined, [
      ...doorSelection.get(),
    ]),
  );
  const introHidden = useBulkIntroHidden();
  const lastSearch = useLastDoorsSearch();
  const invalidate = useInvalidateAssortmentData();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  // Move focus to the new step's heading, but not on first render.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [state.step]);

  const isDone = busy || Boolean(state.result);
  useEffect(() => onDoneChange(isDone), [isDone, onDoneChange]);

  const now = useMemo(() => today(), []);
  const scope = useMemo(() => scopeDoors(state, data, now), [state, data, now]);
  const rawCount =
    state.source === 'upload'
      ? (state.upload?.rows.length ?? 0)
      : state.type === 'tier'
        ? scope.length
        : scope.length * state.skuIds.length;
  const filterCounts = useMemo(() => {
    const rows = buildDoorRows(data).filter((r) => !r.isClosed);
    return Object.fromEntries(
      BULK_SAVED_FILTERS.map((id) => [
        id,
        rows.filter((r) => matchesSavedFilter(r, id, now)).length,
      ]),
    ) as Record<SavedFilterId, number>;
  }, [data, now]);
  const applicable = applicableRows(state.checked);
  const impact = useMemo(
    () =>
      state.step === 3 && state.type ? computeImpact(state.checked, state.type, data) : undefined,
    [state.step, state.type, state.checked, data],
  );

  const backToDoors = () => navigate(doorsPath(lastSearch));

  const run = async (work: (onProgress: Progress) => Promise<Outcome>) => {
    setBusy(true);
    setProgress({ done: 0, total: 0 });
    const result = await work((done, total) => setProgress({ done, total }));
    dispatch({ type: 'setResult', result });
    setProgress(null);
    await invalidate();
    setBusy(false);
  };

  return (
    <div className={styles.workflow}>
      {contextHolder}
      {!introHidden && !isDone ? <BulkIntro onHide={() => bulkIntroHidden.set(true)} /> : null}
      {!isDone ? (
        <BulkSteps
          step={state.step}
          type={state.type}
          rawCount={rawCount}
          applicableCount={applicable.length}
        />
      ) : null}
      <div className={styles.panel} data-testid="bulk-panel">
        {isDone ? (
          <BulkResult
            result={state.result}
            data={data}
            progress={progress}
            busy={busy}
            onViewDoors={() => {
              doorSelection.clear();
              backToDoors();
            }}
            onUndo={() => void run((p) => undoBulk(state.result!, deps, p))}
            onRetry={() => void run((p) => retryFailed(state.result!, deps, p))}
            onRestart={() => dispatch({ type: 'reset' })}
          />
        ) : state.step === 0 ? (
          <StepChooseChange
            type={state.type}
            onPick={(changeType) => dispatch({ type: 'pickType', changeType })}
            onCancel={backToDoors}
            onContinue={() => dispatch({ type: 'continue' })}
            headingRef={headingRef}
          />
        ) : state.step === 1 ? (
          <StepChooseDoors
            state={state}
            dispatch={dispatch}
            data={data}
            scope={scope}
            rawCount={rawCount}
            filterCounts={filterCounts}
            canCheck={canCheck(state, scope.length)}
            onCheck={() =>
              dispatch({
                type: 'setChecked',
                rows: checkRows(buildRawRows(state, data, now), state.type!, data),
              })
            }
            notify={notify}
            headingRef={headingRef}
          />
        ) : state.step === 2 ? (
          <StepCheckRows
            rows={state.checked}
            view={state.rowView}
            source={state.source}
            onView={(view) => dispatch({ type: 'setRowView', view })}
            onDownloadIssues={(rows) => void downloadIssues(rows, now)}
            onBack={() => dispatch({ type: 'back' })}
            onReview={() => dispatch({ type: 'continue' })}
            headingRef={headingRef}
          />
        ) : (
          <StepReview
            type={state.type!}
            impact={impact!}
            errors={state.checked.filter((r) => r.status === 'error').length}
            reason={state.reason}
            onReason={(reason) => dispatch({ type: 'setReason', reason })}
            onBack={() => dispatch({ type: 'back' })}
            onApply={() =>
              void run((p) => applyBulk(applicable, state.type!, state.reason.trim(), deps, p))
            }
            busy={busy}
            headingRef={headingRef}
          />
        )}
      </div>
    </div>
  );
}
