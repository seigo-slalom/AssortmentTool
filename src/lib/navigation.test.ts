import {
  DashboardOutlined,
  FilterOutlined,
  ShoppingOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { describe, expect, it } from 'vitest';
import { EXCLUDED_SCREEN_KEYS, NAV_DESTINATIONS } from './navigation';

describe('NAV_DESTINATIONS', () => {
  it('lists exactly the four in-scope destinations in prototype order', () => {
    expect(NAV_DESTINATIONS.map((d) => d.key)).toEqual([
      'overview',
      'doors',
      'tier-assortments',
      'exceptions',
    ]);
    expect(NAV_DESTINATIONS.map((d) => d.label)).toEqual([
      'Overview',
      'Doors',
      'Tier assortments',
      'Exceptions',
    ]);
    expect(NAV_DESTINATIONS.map((d) => d.path)).toEqual([
      '/',
      '/doors',
      '/tier-assortments',
      '/exceptions',
    ]);
  });

  it('uses the prototype icons', () => {
    expect(NAV_DESTINATIONS.map((d) => d.icon)).toEqual([
      DashboardOutlined,
      ShoppingOutlined,
      TableOutlined,
      FilterOutlined,
    ]);
  });

  it('matches Overview exactly and the others as prefixes', () => {
    expect(NAV_DESTINATIONS.filter((d) => d.end).map((d) => d.key)).toEqual(['overview']);
  });

  it('never links an excluded screen', () => {
    for (const excluded of EXCLUDED_SCREEN_KEYS) {
      for (const d of NAV_DESTINATIONS) {
        expect(d.key).not.toBe(excluded);
        expect(d.path).not.toContain(excluded);
        expect(d.label.toLowerCase().replace(' ', '-')).not.toBe(excluded);
      }
    }
    expect(EXCLUDED_SCREEN_KEYS).toEqual([
      'explorer',
      'exports',
      'activity',
      'data-sources',
      'parking-lot',
    ]);
  });
});
