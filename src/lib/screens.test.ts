import { describe, expect, it } from 'vitest';
import { EXCLUDED_SCREEN_KEYS } from './navigation';
import { APP_NAME, SCREENS, documentTitle, screenById } from './screens';

describe('SCREENS', () => {
  it('matches the data-model registry', () => {
    const rows = SCREENS.map(({ id, path, eyebrow, title, breadcrumb, navKey }) => ({
      id,
      path,
      eyebrow,
      title,
      breadcrumb,
      navKey,
    }));
    const doors = [{ label: 'Doors', to: '/doors' }];
    expect(rows).toEqual([
      {
        id: 'overview',
        path: '/',
        eyebrow: 'Fragrance & Beauty · United States',
        title: 'Overview',
        breadcrumb: undefined,
        navKey: 'overview',
      },
      {
        id: 'doors',
        path: '/doors',
        eyebrow: 'Strategy',
        title: 'Doors',
        breadcrumb: undefined,
        navKey: 'doors',
      },
      {
        id: 'mass-update',
        path: '/doors/mass-update',
        eyebrow: 'Strategy',
        title: 'Mass update',
        breadcrumb: doors,
        navKey: 'doors',
      },
      {
        id: 'door-detail',
        path: '/doors/:doorId',
        eyebrow: 'Strategy',
        title: 'Door detail',
        breadcrumb: doors,
        navKey: 'doors',
      },
      {
        id: 'tier-assortments',
        path: '/tier-assortments',
        eyebrow: 'Strategy',
        title: 'Tier assortments',
        breadcrumb: undefined,
        navKey: 'tier-assortments',
      },
      {
        id: 'exceptions',
        path: '/exceptions',
        eyebrow: 'Strategy',
        title: 'Exceptions',
        breadcrumb: undefined,
        navKey: 'exceptions',
      },
      {
        id: 'not-found',
        path: '*',
        eyebrow: undefined,
        title: 'Page not found',
        breadcrumb: undefined,
        navKey: undefined,
      },
    ]);
  });

  it('gives every in-scope screen a placeholder naming its later spec', () => {
    for (const screen of SCREENS.filter((s) => s.id !== 'not-found')) {
      expect(screen.placeholder?.description, screen.id).toMatch(/spec\.$/);
    }
    expect(screenById('not-found').placeholder).toBeUndefined();
  });

  it('never registers an excluded screen', () => {
    for (const screen of SCREENS) {
      for (const excluded of EXCLUDED_SCREEN_KEYS) {
        expect(screen.id).not.toBe(excluded);
        expect(screen.path).not.toContain(excluded);
      }
    }
  });
});

describe('screen helpers', () => {
  it('finds screens by id', () => {
    expect(screenById('exceptions').title).toBe('Exceptions');
  });

  it('builds document titles with the app name', () => {
    expect(APP_NAME).toBe('Assortment tool');
    expect(documentTitle('Doors')).toBe('Doors · Assortment tool');
  });
});
