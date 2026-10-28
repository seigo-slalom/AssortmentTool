export type StatusCategory = 'open' | 'pre-trade' | 'project' | 'closed' | 'other';
export type StatusTone = 'success' | 'info' | 'warning' | 'critical' | 'neutral' | 'unavailable';

const CATEGORY: Record<string, StatusCategory> = {
  open: 'open',
  'pre-trade': 'pre-trade',
  'project (mtp)': 'project',
  project: 'project',
  closed: 'closed',
  cancelled: 'closed',
};

/** Door status text → category (trimmed, case-insensitive; spec Clarifications). */
export function statusCategory(text?: string): StatusCategory {
  return CATEGORY[(text ?? '').trim().toLowerCase()] ?? 'other';
}

const TONE: Record<StatusCategory, StatusTone> = {
  open: 'success',
  'pre-trade': 'info',
  project: 'neutral',
  closed: 'unavailable',
  other: 'neutral',
};

/** Prototype tones: Open success, Pre-Trade info, Project neutral, Closed/Cancelled unavailable. */
export function statusTone(category: StatusCategory): StatusTone {
  return TONE[category];
}
