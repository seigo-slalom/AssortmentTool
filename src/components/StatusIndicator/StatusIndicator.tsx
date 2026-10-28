import type { ComponentType } from 'react';
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  ExclamationCircleFilled,
  InfoCircleFilled,
  MinusCircleOutlined,
  WarningFilled,
} from '@ant-design/icons';
import styles from './StatusIndicator.module.css';

export type StatusIndicatorTone =
  'critical' | 'error' | 'warning' | 'success' | 'info' | 'neutral' | 'unavailable';

export interface StatusIndicatorProps {
  tone: StatusIndicatorTone;
  label: string;
  /** Shows only the icon; the label stays available to assistive technology. */
  iconOnly?: boolean;
}

// Icon per tone, as in the prototype's ChanelUI StatusIndicator.
const ICONS: Record<StatusIndicatorTone, ComponentType<{ className?: string }>> = {
  critical: CloseCircleFilled,
  error: ExclamationCircleFilled,
  warning: WarningFilled,
  success: CheckCircleFilled,
  info: InfoCircleFilled,
  neutral: ClockCircleOutlined,
  unavailable: MinusCircleOutlined,
};

/** Icon + label status (port of the prototype's ChanelUI StatusIndicator). */
export function StatusIndicator({ tone, label, iconOnly = false }: StatusIndicatorProps) {
  const Icon = ICONS[tone];
  return (
    <span
      className={`cds-status cds-status--${tone} ${styles.status} ${styles[tone]}`}
      data-tone={tone}
    >
      <Icon aria-hidden className={`cds-status__icon ${styles.icon}`} />
      <span className={iconOnly ? 'cds-sr-only' : 'cds-status__label'}>{label}</span>
    </span>
  );
}
