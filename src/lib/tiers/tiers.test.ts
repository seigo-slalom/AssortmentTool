import { describe, expect, it } from 'vitest';
import type { DoorRecord, SkuRecord, TierRecord } from '../data';
import {
  addExceptionSkuIds,
  applyShow,
  axisOptions,
  buildGroups,
  buildMembership,
  dropTier,
  eligibleTierDoors,
  filterSkus,
  isDuplicateName,
  isEffective,
  isNewSku,
  isTierFormValid,
  newTierForm,
  parseKey,
  placeTier,
  previousTierId,
  rankChanges,
  retireAvgDelta,
  ruleKey,
  showCounts,
  skuTypeLabel,
  stagedForTier,
  stagedImpact,
  stagedTierCount,
  stageMany,
  stageOne,
  tierAssortmentSheet,
  tierAxisCounts,
  tierDoorCounts,
  tierFormImpact,
  tierSkuCounts,
  withoutKeys,
  type TierForm,
} from '.';

const sku = (id: string, p: Partial<SkuRecord> = {}): SkuRecord => ({ id, ...p });
const door = (id: string, p: Partial<DoorRecord> = {}): DoorRecord => ({ id, name: id, ...p });
const tiers: TierRecord[] = [
  { id: 'T1', name: 'Access', rank: 1, active: true },
  { id: 'T2', name: 'Core', rank: 2, active: true, description: 'Mid' },
  { id: 'T3', name: 'Elite', rank: 5, active: true },
];
const S1 = sku('S1', {
  key: '1',
  name: 'Alpha',
  axis: 'Fragrance',
  franchise: 'N°5',
  type: 'retail',
  line: 'EDP',
  category: 'Perfume',
});
const S2 = sku('S2', { key: '2', name: 'Beta', axis: 'Fragrance', franchise: 'N°5', type: 'spm' });
const S3 = sku('S3', { name: 'Gamma', axis: 'Makeup', franchise: 'Rouge', type: 'spm' });
const S4 = sku('S4');
const skus = [S1, S2, S3, S4];
const skuById = new Map(skus.map((k) => [k.id, k]));
const m = buildMembership([
  { id: 'R1', tierId: 'T1', skuId: 'S1' },
  { id: 'R2', tierId: 'T2', skuId: 'S1' },
  { id: 'R3', tierId: 'T1', skuId: 'S3' },
  { id: 'R4', tierId: 'T1', skuId: 'GONE' },
  { id: 'R5', tierId: 'T2', skuId: 'S4' },
]);

describe('membership', () => {
  it('keys, membership and effective state', () => {
    expect(parseKey(ruleKey('S1', 'T1'))).toEqual({ skuId: 'S1', tierId: 'T1' });
    expect(m.ruleId.get('S1|T2')).toBe('R2');
    expect(isEffective({}, m, 'S1', 'T1')).toBe(true);
    expect(isEffective({ 'S1|T1': false }, m, 'S1', 'T1')).toBe(false);
    expect(isEffective({}, m, 'S9', 'T1')).toBe(false);
  });

  it('new SKUs are in no tier and have no add exception', () => {
    const adds = addExceptionSkuIds([
      { id: 'E1', action: 'add', skuId: 'S8' },
      { id: 'E2', action: 'add' },
      { id: 'E3', action: 'remove', skuId: 'S9' },
    ]);
    expect([...adds]).toEqual(['S8']);
    expect(isNewSku(m, adds, 'S2')).toBe(true);
    expect(isNewSku(m, adds, 'S8')).toBe(false);
    expect(isNewSku(m, adds, 'S1')).toBe(false);
  });

  it('counts active tiered doors, SKUs and axes per tier', () => {
    const counts = tierDoorCounts([
      door('D1', { tierId: 'T1', productLine: 'Fragrance', onlineOffline: 'Online' }),
      door('D2', { tierId: 'T1', productLine: 'Fragrance' }),
      door('D3', { tierId: 'T1' }),
      door('D4', { tierId: 'T1', status: 'Closed' }),
      door('D5'),
    ]);
    expect(counts.get('T1')).toEqual({
      total: 3,
      byLine: new Map([
        ['Fragrance', 2],
        ['', 1],
      ]),
      online: 1,
      offline: 2,
    });
    expect(tierSkuCounts(m, skuById).get('T1')).toEqual({ retail: 1, spm: 1 });
    expect(tierSkuCounts(m, skuById).get('T2')).toEqual({ retail: 2, spm: 0 });
    const axes = tierAxisCounts(m, skuById);
    expect(axes.get('T1')).toEqual(
      new Map([
        ['Fragrance', 1],
        ['Makeup', 1],
      ]),
    );
    expect(axes.get('T2')).toEqual(new Map([['Fragrance', 1]]));
  });
});

describe('staging and impact', () => {
  it('stages, un-stages and counts', () => {
    let st = stageOne({}, m, 'S2', 'T1', true);
    expect(st).toEqual({ 'S2|T1': true });
    st = stageOne(st, m, 'S2', 'T1', false);
    expect(st).toEqual({});
    const many = stageMany({ 'S1|T1': false, 'S3|T1': false }, m, ['S1', 'S2', 'S3'], 'T1', true);
    expect(many).toEqual({ staged: { 'S2|T1': true }, changed: 3 });
    expect(stageMany(many.staged, m, ['S2', 'S1'], 'T1', true).changed).toBe(0);
    const mixed = { 'S2|T1': true, 'S3|T2': true };
    expect(stagedForTier(mixed, 'T1')).toBe(1);
    expect(stagedTierCount(mixed)).toBe(2);
    expect(dropTier(mixed, 'T1')).toEqual({ 'S3|T2': true });
    expect(withoutKeys(mixed, ['S2|T1'])).toEqual({ 'S3|T2': true });
  });

  it('door impact uses doors whose product line equals the SKU axis', () => {
    const counts = tierDoorCounts([
      door('D1', { tierId: 'T1', productLine: 'Fragrance' }),
      door('D2', { tierId: 'T1', productLine: 'Fragrance' }),
      door('D3', { tierId: 'T1', productLine: 'Makeup' }),
    ]);
    expect(eligibleTierDoors(counts, 'T1', S1)).toBe(2);
    expect(eligibleTierDoors(counts, 'T1', S4)).toBe(0);
    expect(eligibleTierDoors(counts, 'T1', undefined)).toBe(0);
    expect(eligibleTierDoors(counts, 'T9', S1)).toBe(0);
    expect(eligibleTierDoors(counts, 'T1', sku('X', { axis: 'Skincare' }))).toBe(0);
    expect(stagedImpact({ 'S2|T1': true, 'S3|T1': false, 'S3|T2': true }, counts, skuById)).toEqual(
      {
        changes: 3,
        tiers: 2,
        doorDelta: 1,
      },
    );
  });
});

describe('filters and groups', () => {
  const isNew = (id: string) => id === 'S2';
  it('filters by axis, type, search and focus', () => {
    const base = { search: '', types: [] as const, focus: null };
    expect(filterSkus(skus, { ...base, axis: 'Makeup' }, isNew)).toEqual([S3]);
    expect(filterSkus(skus, { ...base, types: ['spm'] }, isNew)).toEqual([S2, S3]);
    expect(filterSkus(skus, { ...base, search: ' rouge ' }, isNew)).toEqual([S3]);
    expect(filterSkus(skus, { ...base, search: '1' }, isNew)).toEqual([S1]);
    expect(filterSkus(skus, { ...base, focus: 'fresh' }, isNew)).toEqual([S2]);
    expect(axisOptions(skus)).toEqual(['Fragrance', 'Makeup']);
    expect(skuTypeLabel(undefined)).toBe('—');
  });

  it('counts and applies the show switch', () => {
    const isIn = (id: string) => id === 'S1';
    expect(showCounts(skus, isIn)).toEqual({ all: 4, in: 1, out: 3 });
    expect(applyShow(skus, 'all', isIn)).toHaveLength(4);
    expect(applyShow(skus, 'in', isIn)).toEqual([S1]);
    expect(applyShow(skus, 'out', isIn)).toEqual([S2, S3, S4]);
  });

  it('builds sorted groups with coverage, toggles and rows', () => {
    const extra = sku('S5', { name: 'Delta', axis: 'Makeup', franchise: 'Rouge', type: 'spm' });
    const retailOnly = sku('S6', { axis: 'Fragrance', franchise: 'Allure', type: 'retail' });
    const groups = buildGroups([S2, S1, S3, S4, extra, retailOnly, sku('S7')], {
      tierId: 'T1',
      staged: { 'S2|T1': true, 'S3|T1': false },
      membership: m,
      isNew,
      otherTiers: [{ id: 'T2', name: 'Core' }],
    });
    expect(groups.map((g) => g.key)).toEqual([
      '—|—',
      'Fragrance|Allure',
      'Fragrance|N°5',
      'Makeup|Rouge',
    ]);
    const [none, allure, n5, rouge] = groups;
    expect(allure.sub).toBe('Fragrance · 1 SKU · retail');
    expect(n5).toMatchObject({
      sub: 'Fragrance · 2 SKUs (1 retail, 1 SPM)',
      inCount: 2,
      pct: 100,
      checked: true,
      add: false,
      toggleIds: ['S2', 'S1'],
      stagedCount: 1,
      newCount: 1,
    });
    expect(n5.rows.map((r) => [r.label, r.sub, r.also, r.staged])).toEqual([
      ['1 · Alpha', 'Retail · EDP · Perfume', 'Also in Core', null],
      ['2 · Beta', 'SPM', 'In no other tier', 'add'],
    ]);
    expect(rouge).toMatchObject({
      sub: 'Makeup · 2 SKUs · SPM',
      inCount: 0,
      add: true,
      indeterminate: false,
    });
    expect(rouge.rows.map((r) => [r.sku.id, r.staged])).toEqual([
      ['S5', null],
      ['S3', 'remove'],
    ]);
    expect(none.rows[0].label).toBe('— · —');
  });
});

describe('tier form', () => {
  const form = (p: Partial<TierForm>): TierForm => ({ ...newTierForm('add', tiers), ...p });

  it('creates defaults per mode', () => {
    expect(newTierForm('add', tiers)).toMatchObject({ after: 'T3', copyFrom: 'T3', name: '' });
    expect(newTierForm('add', [])).toMatchObject({ after: '', copyFrom: null });
    expect(newTierForm('edit', tiers, 'T2')).toMatchObject({
      name: 'Core',
      description: 'Mid',
      after: 'T1',
    });
    expect(newTierForm('edit', tiers, 'T1')).toMatchObject({ description: '', after: '' });
    expect(newTierForm('edit', tiers, 'TX')).toMatchObject({ name: '', after: '' });
    expect(newTierForm('retire', tiers)).toMatchObject({ after: '' });
    expect(previousTierId(tiers, 'T3')).toBe('T2');
  });

  it('validates names, reasons and mode rules', () => {
    expect(isDuplicateName(form({ name: ' core ' }), tiers)).toBe(true);
    expect(isDuplicateName(form({ name: 'Core', tierId: 'T2' }), tiers)).toBe(false);
    expect(isDuplicateName(form({ name: '' }), tiers)).toBe(false);
    expect(isTierFormValid(form({ name: 'New', reason: 'r' }), tiers, 0)).toBe(true);
    expect(isTierFormValid(form({ name: 'New', reason: 'r', copyFrom: null }), tiers, 0)).toBe(
      false,
    );
    expect(
      isTierFormValid(form({ name: 'New', reason: 'r', start: 'empty', copyFrom: null }), tiers, 0),
    ).toBe(true);
    expect(isTierFormValid(form({ name: 'x'.repeat(31), reason: 'r' }), tiers, 0)).toBe(false);
    expect(isTierFormValid(form({ name: 'New', reason: ' ' }), tiers, 0)).toBe(false);
    const edit = newTierForm('edit', tiers, 'T2');
    expect(isTierFormValid({ ...edit, reason: 'r' }, tiers, 0)).toBe(false);
    expect(isTierFormValid({ ...edit, reason: 'r', name: 'Core+' }, tiers, 0)).toBe(true);
    expect(isTierFormValid({ ...edit, reason: 'r', description: 'x' }, tiers, 0)).toBe(true);
    expect(isTierFormValid({ ...edit, reason: 'r', after: '' }, tiers, 0)).toBe(true);
    expect(
      isTierFormValid(
        { ...newTierForm('edit', tiers, 'T1'), reason: 'r', description: 'd' },
        tiers,
        0,
      ),
    ).toBe(true);
    expect(isTierFormValid({ ...edit, tierId: 'TX', reason: 'r' }, tiers, 0)).toBe(false);
    const retire = { ...newTierForm('retire', tiers, 'T1'), reason: 'r' };
    expect(isTierFormValid(retire, tiers, 0)).toBe(true);
    expect(isTierFormValid(retire, tiers, 2)).toBe(false);
    expect(isTierFormValid({ ...retire, moveTo: 'T2' }, tiers, 2)).toBe(true);
    expect(isTierFormValid(retire, [tiers[0]], 0)).toBe(false);
    expect(isTierFormValid({ ...retire, reason: '' }, tiers, 0)).toBe(false);
  });

  it('re-ranks and estimates retire impact', () => {
    expect(placeTier(['T1', 'T2', 'T3'], 'T3', '')).toEqual(['T3', 'T1', 'T2']);
    expect(placeTier(['T1', 'T2'], 'NEW', 'T1')).toEqual(['T1', 'NEW', 'T2']);
    const rank = new Map(tiers.map((t) => [t.id, t.rank]));
    expect(rankChanges(['T1', 'T2', 'T3'], (id) => rank.get(id))).toEqual([{ id: 'T3', rank: 3 }]);
    const axes = tierAxisCounts(m, skuById);
    expect(retireAvgDelta([], 'T1', 'T2', axes)).toBe(0);
    expect(
      retireAvgDelta(
        [door('D1', { productLine: 'Makeup' }), door('D2', { productLine: 'Makeup' }), door('D3')],
        'T1',
        'T9',
        axes,
      ),
    ).toBe(-1);
  });

  it('describes what happens', () => {
    const name = (id: string) => `<${id}>`;
    expect(tierFormImpact(form({}), { tierName: name, copyCounts: { retail: 2, spm: 1 } })[0]).toBe(
      'Starts with 3 SKUs copied from <T3> (2 retail · 1 SPM). Brand Management and Trade Marketing then adjust them here.',
    );
    expect(tierFormImpact(form({}), { tierName: name })[0]).toContain('Starts with 0 SKUs');
    expect(tierFormImpact(form({ start: 'empty' }), { tierName: name })[0]).toMatch(
      /^Starts empty/,
    );
    expect(tierFormImpact(form({ mode: 'edit' }), { tierName: name })).toHaveLength(1);
    const retire = form({ mode: 'retire' });
    expect(tierFormImpact(retire, { tierName: name })).toEqual([
      'No doors are in this tier, so no door assortment changes.',
      'Its 0 SKU assignments are removed. Door and retailer exceptions stay in place.',
    ]);
    const r = { doors: 2, avgDelta: -3, skuAssignments: 1 };
    expect(tierFormImpact(retire, { tierName: name, retire: r })[0]).toBe(
      'Choose where its 2 doors go to see the impact.',
    );
    expect(tierFormImpact({ ...retire, moveTo: 'T2' }, { tierName: name, retire: r })[0]).toBe(
      '2 doors move to <T2>. On average each loses 3 SKUs.',
    );
    expect(
      tierFormImpact(
        { ...retire, moveTo: 'T2' },
        { tierName: name, retire: { ...r, avgDelta: 1 } },
      )[0],
    ).toContain('gains 1 SKU');
  });
});

describe('export', () => {
  it('writes one Yes column per tier', () => {
    const sheet = tierAssortmentSheet([S1, S4], tiers.slice(0, 2), m);
    expect(sheet.columns.map((c) => c.header)).toEqual([
      'SKU key',
      'SKU name',
      'Franchise',
      'Line',
      'Axis',
      'SKU type',
      'Access',
      'Core',
    ]);
    expect(sheet.rows).toEqual([
      ['1', 'Alpha', 'N°5', 'EDP', 'Fragrance', 'Retail', 'Yes', 'Yes'],
      ['', '', '', '', '', '—', '', 'Yes'],
    ]);
  });
});
