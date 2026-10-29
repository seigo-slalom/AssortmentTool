import type { NavKey } from './navigation';

export const APP_NAME = 'Assortment tool';

export type ScreenId =
  | 'overview'
  | 'doors'
  | 'door-detail'
  | 'bulk-update'
  | 'tier-assortments'
  | 'exceptions'
  | 'not-found';

export interface ScreenDefinition {
  readonly id: ScreenId;
  readonly path: string;
  readonly title: string;
  readonly eyebrow?: string;
  readonly breadcrumb?: readonly { readonly label: string; readonly to: string }[];
  readonly navKey?: NavKey;
  readonly placeholder?: { readonly title: string; readonly description: string };
}

const STRATEGY = 'Strategy';
const DOORS_CRUMB = [{ label: 'Doors', to: '/doors' }] as const;

// Page-header copy comes from docs/Assortment-Tool-Prototype.html; content arrives in later specs.
export const SCREENS: readonly ScreenDefinition[] = [
  {
    id: 'overview',
    path: '/',
    title: 'Overview',
    eyebrow: 'Fragrance & Beauty · United States',
    navKey: 'overview',
    placeholder: {
      title: 'Overview',
      description: 'Next steps, key figures and charts arrive with the Overview spec.',
    },
  },
  {
    id: 'doors',
    path: '/doors',
    title: 'Doors',
    eyebrow: STRATEGY,
    navKey: 'doors',
  },
  {
    id: 'bulk-update',
    path: '/doors/bulk-update',
    title: 'Bulk Update',
    eyebrow: STRATEGY,
    breadcrumb: DOORS_CRUMB,
    navKey: 'doors',
  },
  {
    id: 'door-detail',
    path: '/doors/:doorId',
    title: 'Door detail',
    eyebrow: STRATEGY,
    breadcrumb: DOORS_CRUMB,
    navKey: 'doors',
    placeholder: {
      title: 'Door detail',
      description: "The door's derived assortment and its reasons arrive with the Doors spec.",
    },
  },
  {
    id: 'tier-assortments',
    path: '/tier-assortments',
    title: 'Tier assortments',
    eyebrow: STRATEGY,
    navKey: 'tier-assortments',
  },
  {
    id: 'exceptions',
    path: '/exceptions',
    title: 'Exceptions',
    eyebrow: STRATEGY,
    navKey: 'exceptions',
    placeholder: {
      title: 'Exceptions',
      description: 'Door and retailer exceptions arrive with the Exceptions spec.',
    },
  },
  { id: 'not-found', path: '*', title: 'Page not found' },
];

export function screenById(id: ScreenId): ScreenDefinition {
  return SCREENS.find((screen) => screen.id === id)!;
}

export function documentTitle(title: string): string {
  return `${title} · ${APP_NAME}`;
}
