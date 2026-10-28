export const TIER_REASONS = [
  'New door opening',
  'Sales above tier threshold',
  'Sales below tier threshold',
  'Retailer request',
] as const;

export const SKU_REASONS = [
  'Launch distribution',
  'Fixture constraint',
  'Retailer agreement',
  'Limited edition allocation',
] as const;

export const REASON_MAX_LENGTH = 280;
