import { useMemo, useState } from 'react';
import { Alert, Modal, Select, message, type ButtonProps } from 'antd';
import { Field } from '../../components/Field';
import { ReasonField } from '../../components/ReasonField';
import { setDoorTier, useInvalidateAssortmentData, type AssortmentData } from '../../lib/data';
import { TIER_REASONS } from '../../lib/doors';
import { fmt } from '../../lib/format';
import { px, token } from '../../theme/token';
import { impactText, tierImpact } from './tierImpact';
import styles from './TierChangeDialog.module.css';

export interface TierChangeDialogProps {
  data: AssortmentData;
  doorId: string;
  /** The tier picked in the grid; the dialog opens with it chosen. */
  initialTierId: string;
  onClose: () => void;
  notify: ReturnType<typeof message.useMessage>[0];
}

/** "Change tier" confirmation with engine impact and a required reason (US3, FR-024–FR-027). */
export function TierChangeDialog({
  data,
  doorId,
  initialTierId,
  onClose,
  notify,
}: TierChangeDialogProps) {
  const door = data.index.doorById.get(doorId)!;
  const [toTierId, setToTierId] = useState(initialTierId);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const invalidate = useInvalidateAssortmentData();

  const current = door.tierId ? data.index.tierById.get(door.tierId) : undefined;
  // Pickers only offer active tiers, so the chosen tier always exists.
  const target = data.index.tierById.get(toTierId)!;
  const sameTier = current?.id === target.id;
  const impact = useMemo(
    () => (sameTier ? undefined : tierImpact(data, doorId, target.id)),
    [data, doorId, target, sameTier],
  );
  const canSave = !sameTier && reason.trim().length > 0;
  const impactCopy = impact ? impactText(impact, door) : `This door is already ${target.name}.`;

  const save = async () => {
    setSaving(true);
    setError(null);
    const result = await setDoorTier(doorId, target.id);
    if (!result.ok) {
      setSaving(false);
      setError(`The tier could not be saved: ${result.error}`);
      return;
    }
    await invalidate();
    setSaving(false);
    notify.success(
      `${door.name} moved to ${target.name}. It now receives ${fmt(impact!.total)} SKUs (${fmt(impact!.retail)} retail · ${fmt(impact!.spm)} SPM).`,
    );
    onClose();
  };

  return (
    <Modal
      open
      title="Change tier"
      okText="Save change"
      cancelText="Cancel"
      okButtonProps={{ disabled: !canSave, 'data-testid': 'tier-dialog-save' } as ButtonProps}
      confirmLoading={saving}
      onOk={save}
      onCancel={onClose}
      width={px(token.size['modal-width'])}
      rootClassName="cds-overlay-root"
    >
      <div className={styles.body} data-testid="tier-dialog">
        <span>
          Change tier for {door.name} from {current?.name ?? 'no tier'} to {target.name}?
        </span>
        <Field label="New tier" required>
          <Select
            value={toTierId}
            placeholder="Choose a tier"
            options={data.index.activeTiers.map((t) => ({ value: t.id, label: t.name }))}
            onChange={(value: string) => setToTierId(value)}
            className={styles.select}
          />
        </Field>
        <div className={styles.impact} data-testid="tier-impact">
          {impactCopy}
        </div>
        <ReasonField
          value={reason}
          onChange={setReason}
          reasons={TIER_REASONS}
          rows={3}
          placeholder="For example: sales above Premium threshold"
          help="Pick a reason or type your own. Tier-change reasons are not saved."
        />
        {error ? <Alert type="error" showIcon title={error} /> : null}
      </div>
    </Modal>
  );
}
