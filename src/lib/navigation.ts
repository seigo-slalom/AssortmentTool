import type { ComponentType } from 'react';
import {
  DashboardOutlined,
  FilterOutlined,
  ShoppingOutlined,
  TableOutlined,
} from '@ant-design/icons';

export type NavKey = 'overview' | 'doors' | 'tier-assortments' | 'exceptions';

export interface NavDestination {
  readonly key: NavKey;
  readonly label: string;
  readonly path: string;
  readonly icon: ComponentType;
  /** Only match the exact path (Overview at `/` would otherwise match every route). */
  readonly end: boolean;
}

// Flat, always-visible list in prototype order. Excluded screens never appear here.
export const NAV_DESTINATIONS: readonly NavDestination[] = [
  { key: 'overview', label: 'Overview', path: '/', icon: DashboardOutlined, end: true },
  { key: 'doors', label: 'Doors', path: '/doors', icon: ShoppingOutlined, end: false },
  {
    key: 'tier-assortments',
    label: 'Tier assortments',
    path: '/tier-assortments',
    icon: TableOutlined,
    end: false,
  },
  { key: 'exceptions', label: 'Exceptions', path: '/exceptions', icon: FilterOutlined, end: false },
];

/** Prototype screens excluded by the constitution; they must never be routed or linked. */
export const EXCLUDED_SCREEN_KEYS = [
  'explorer',
  'exports',
  'activity',
  'data-sources',
  'parking-lot',
] as const;
