export type ExpectedTier = 'compact' | 'standard' | 'wide';

export interface Viewport {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly tier: ExpectedTier;
}

// Constitution Principle XI viewport matrix.
export const VIEWPORTS: readonly Viewport[] = [
  { name: '360x740', width: 360, height: 740, tier: 'compact' },
  { name: '390x844', width: 390, height: 844, tier: 'compact' },
  { name: '768x1024', width: 768, height: 1024, tier: 'compact' },
  { name: '1024x768', width: 1024, height: 768, tier: 'standard' },
  { name: '1366x768', width: 1366, height: 768, tier: 'standard' },
  { name: '1920x1080', width: 1920, height: 1080, tier: 'wide' },
  { name: '2560x1440', width: 2560, height: 1440, tier: 'wide' },
];
