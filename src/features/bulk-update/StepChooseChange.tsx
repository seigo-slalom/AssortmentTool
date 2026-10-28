import type { Ref } from 'react';
import { Button, Flex } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FormActions } from '../../components/FormActions';
import { StatusIndicator } from '../../components/StatusIndicator';
import { WorkflowSection } from '../../components/WorkflowSection';
import { TYPE_NAME } from './options';
import type { ChangeType } from './types';
import styles from './BulkUpdate.module.css';

const CARDS: { type: ChangeType; desc: string; facts: [string, string][] }[] = [
  {
    type: 'tier',
    desc: 'Move a set of doors to a new tier, for example after a cluster review. Each door then receives that tier’s assortment.',
    facts: [
      ['Changes', 'The tier on each door'],
      ['Who', 'Anyone using the tool'],
      ['Limit', 'Up to 2,500 doors per file'],
      ['Afterwards', 'New assortment shows at once'],
    ],
  },
  {
    type: 'sku',
    desc: 'Door-level exceptions for fixture limits, flagship doors or a retailer agreement. Each door and SKU pair becomes one exception.',
    facts: [
      ['Changes', 'One door exception per door and SKU'],
      ['Your scope', 'Retail and SPM SKUs'],
      ['Limit', 'Up to 5,000 rows per file'],
      ['Afterwards', 'New assortment shows at once'],
    ],
  },
];

export interface StepChooseChangeProps {
  type?: ChangeType;
  onPick: (type: ChangeType) => void;
  onCancel: () => void;
  onContinue: () => void;
  headingRef: Ref<HTMLHeadingElement>;
}

/** Step 1: pick the change; the redirect panel points whole-tier/retailer changes elsewhere. */
export function StepChooseChange({
  type,
  onPick,
  onCancel,
  onContinue,
  headingRef,
}: StepChooseChangeProps) {
  const navigate = useNavigate();
  return (
    <WorkflowSection number={1} title="Choose the change" ref={headingRef}>
      <div className={styles.stack}>
        <span>
          Pick what you are changing first. The template, the checks and the result all follow from
          it.
        </span>
        <div className={styles.cards}>
          {CARDS.map((card) => {
            const selected = type === card.type;
            return (
              <button
                key={card.type}
                type="button"
                className={styles.card}
                aria-pressed={selected}
                onClick={() => onPick(card.type)}
                data-testid={`bulk-card-${card.type}`}
              >
                <span className={styles.cardHead}>
                  <span className={styles.cardTitle}>{TYPE_NAME[card.type]}</span>
                  {selected ? <StatusIndicator tone="success" label="Selected" /> : null}
                </span>
                <span>{card.desc}</span>
                <dl className={styles.facts}>
                  {card.facts.map(([k, v]) => (
                    <div key={k} className={styles.factRow}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </button>
            );
          })}
          <div className={styles.redirect} data-testid="bulk-redirect">
            <span className={styles.cardTitle}>SKUs for a whole tier or retailer?</span>
            <span>
              Bulk update is the wrong tool for this. One tier rule or one retailer exception covers
              every door, including doors that open later, instead of thousands of door exceptions.
            </span>
            <span className={styles.muted}>
              SKUs for a whole tier are set in Tier assortments. Retailer exceptions apply to every
              door with the same Distributor Name code.
            </span>
            <Flex wrap align="center" gap="small">
              <Button onClick={() => navigate('/tier-assortments')}>Open Tier assortments</Button>
              <Button onClick={() => navigate('/exceptions')}>Add a retailer exception</Button>
            </Flex>
          </div>
        </div>
        <FormActions>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" disabled={!type} onClick={onContinue}>
            Continue
          </Button>
        </FormActions>
      </div>
    </WorkflowSection>
  );
}
