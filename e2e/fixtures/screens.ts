export interface E2EScreen {
  readonly id: string;
  readonly hash: string;
  readonly title: string;
  readonly eyebrow?: string;
  readonly breadcrumb?: string;
  readonly navLabel?: string;
}

// Mirrors specs/002-app-shell-tokens/contracts/ui-shell.md.
export const SCREENS: readonly E2EScreen[] = [
  {
    id: 'overview',
    hash: '#/',
    title: 'Overview',
    eyebrow: 'Fragrance & Beauty · United States',
    navLabel: 'Overview',
  },
  { id: 'doors', hash: '#/doors', title: 'Doors', eyebrow: 'Strategy', navLabel: 'Doors' },
  {
    id: 'door-detail',
    hash: '#/doors/D-001',
    title: 'Door detail',
    eyebrow: 'Strategy',
    breadcrumb: 'Doors',
    navLabel: 'Doors',
  },
  {
    id: 'bulk-update',
    hash: '#/doors/bulk-update',
    title: 'Bulk Update',
    eyebrow: 'Strategy',
    breadcrumb: 'Doors',
    navLabel: 'Doors',
  },
  {
    id: 'tier-assortments',
    hash: '#/tier-assortments',
    title: 'Tier assortments',
    eyebrow: 'Strategy',
    navLabel: 'Tier assortments',
  },
  {
    id: 'exceptions',
    hash: '#/exceptions',
    title: 'Exceptions',
    eyebrow: 'Strategy',
    navLabel: 'Exceptions',
  },
];

export const EXCLUDED_HASHES = [
  '#/explorer',
  '#/exports',
  '#/activity',
  '#/data-sources',
  '#/parking-lot',
] as const;

export const NOT_FOUND: E2EScreen = {
  id: 'not-found',
  hash: '#/explorer',
  title: 'Page not found',
};

export const MATRIX_PAGES: readonly E2EScreen[] = [...SCREENS, NOT_FOUND];

export const NAV_LABELS = ['Overview', 'Doors', 'Tier assortments', 'Exceptions'] as const;
