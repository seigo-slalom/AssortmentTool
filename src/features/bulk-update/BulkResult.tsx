import { Button, Flex, Result, Steps } from 'antd';
import { ConfirmAction } from '../../components/ConfirmAction';
import type { AssortmentData } from '../../lib/data';
import { fmt, plural } from '../../lib/format';
import { doorCount, STALE_MESSAGE } from './applyBulk';
import type { BulkResult as Outcome } from './types';
import styles from './BulkUpdate.module.css';

export interface BulkResultProps {
  result?: Outcome;
  data: AssortmentData;
  progress: { done: number; total: number } | null;
  busy: boolean;
  onViewDoors: () => void;
  onUndo: () => void;
  onRetry: () => void;
  onRestart: () => void;
}

function title(result: Outcome, data: AssortmentData): string {
  if (result.kind === 'undone') return 'Update undone';
  const n = result.succeeded.length;
  if (result.type === 'tier') {
    // A re-tier result only holds tier changes.
    const targets = new Set(
      result.succeeded.map((c) => (c as Extract<typeof c, { kind: 'tier' }>).newTierId),
    );
    const target =
      targets.size === 1 ? data.index.tierById.get([...targets][0])!.name : 'their new tiers';
    return `${plural(n, 'door', 'doors')} moved to ${target}.`;
  }
  return `${plural(n, 'door exception', 'door exceptions')} created at ${plural(doorCount(result), 'door', 'doors')}.`;
}

function subTitle(result: Outcome): string {
  if (result.kind === 'undone') {
    return result.failed.length
      ? `${plural(result.failed.length, 'change', 'changes')} could not be reversed.`
      : 'Every change from this update was reversed.';
  }
  const parts = [
    `Applied ${fmt(result.succeeded.length)} of ${plural(result.total, 'row', 'rows')}.`,
  ];
  if (result.stale.length) {
    parts.push(
      `${plural(result.stale.length, 'row was', 'rows were')} changed by someone else and not updated.`,
    );
  }
  if (result.failed.length)
    parts.push(`${plural(result.failed.length, 'row', 'rows')} could not be saved.`);
  return parts.join(' ');
}

/** Result screen with progress, problems, undo and next steps (FR-046–FR-048). */
export function BulkResult({
  result,
  data,
  progress,
  busy,
  onViewDoors,
  onUndo,
  onRetry,
  onRestart,
}: BulkResultProps) {
  const problems = result
    ? [
        ...result.failed.map((f) => `${f.doorLabel}: ${f.error}`),
        ...result.stale.map((r) => `${r.doorLabel}: ${STALE_MESSAGE}`),
      ]
    : [];
  const status = !result
    ? 'info'
    : result.kind === 'undone'
      ? result.failed.length
        ? 'warning'
        : 'info'
      : problems.length
        ? 'warning'
        : 'success';
  // Before the first result arrives, progress is always set (the workflow sets it on start).
  const live = progress
    ? `Applying ${fmt(progress.done)} of ${fmt(progress.total)}…`
    : result!.kind === 'undone'
      ? 'The reversal shows straight away.'
      : `Every screen already shows the new assortment for ${plural(doorCount(result!), 'door', 'doors')}.`;

  return (
    <div className={styles.result} data-testid="bulk-result">
      {result ? (
        <Result status={status} title={title(result, data)} subTitle={subTitle(result)} />
      ) : (
        <Result
          status="info"
          title="Applying the update"
          subTitle="Keep this page open until it finishes."
        />
      )}
      <div className={styles.progress}>
        <Steps
          size="small"
          current={result ? 1 : 0}
          status={result ? 'finish' : 'process'}
          items={[{ title: 'Saved' }, { title: 'Assortment updated' }]}
        />
        <span aria-live="polite" className={styles.muted} data-testid="bulk-progress">
          {live}
        </span>
      </div>
      {problems.length ? (
        <div className={styles.notice} data-testid="bulk-failures">
          <ul className={styles.failures}>
            {problems.map((text, i) => (
              <li key={`${i}-${text}`}>{text}</li>
            ))}
          </ul>
          {result!.failed.length ? (
            <div>
              <Button onClick={onRetry} loading={busy}>
                Retry failed rows
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
      {result ? (
        <div className={styles.centered}>
          <Flex wrap align="center" gap="small">
            <Button type="primary" onClick={onViewDoors} disabled={busy}>
              View doors
            </Button>
            {result.kind === 'applied' && result.succeeded.length ? (
              <ConfirmAction
                label="Undo this update"
                title="Undo this bulk update?"
                description="Every change from this update is reversed."
                confirmLabel="Undo update"
                onConfirm={onUndo}
                disabled={busy}
                testId="bulk-undo"
              />
            ) : null}
            <Button type="text" onClick={onRestart} disabled={busy}>
              Start another update
            </Button>
          </Flex>
        </div>
      ) : null}
    </div>
  );
}
