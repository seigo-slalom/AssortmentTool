import { describe, expect, it } from 'vitest';
import { makeData } from '../../lib/doors/fixtures.testutil';
import { checkRows, STATUS_LABEL, STATUS_TONE } from './checkRows';
import type { RawRow } from './types';

const data = makeData();
const door = (id: string) => data.index.doorById.get(id)!;
const fromDoor = (id: string, extra: Partial<RawRow>, line = 2): RawRow => ({
  line,
  doorKey: door(id).doorKey!,
  doorName: door(id).name,
  door: door(id),
  ...extra,
});
const summary = (rows: ReturnType<typeof checkRows>) => rows.map((r) => [r.status, r.message]);

describe('checkRows — re-tier (FR-040)', () => {
  it('applies each rule in order', () => {
    const rows = checkRows(
      [
        { line: 2, doorKey: 'US9999', doorName: 'Mall of the South', value: 'Premium' },
        { line: 3, doorKey: 'us1001', value: 'Premium Plus' },
        fromDoor('D3', { value: 'Premium' }),
        fromDoor('D4', { value: 'premium' }),
        fromDoor('D1', { value: 'Premium' }),
        fromDoor('D2', { value: 'Expertise' }),
        { line: 8, doorKey: 'US1005', value: 'Access' },
      ],
      'tier',
      data,
    );
    expect(summary(rows)).toEqual([
      ['error', 'Door key not found in the door list. Check the key, for example US1542.'],
      ['error', '“Premium Plus” is not a tier. Use Access, Premium, Expertise.'],
      ['skipped', 'Closed: tiers are not changed on closed or cancelled doors.'],
      ['nochange', 'Already Premium.'],
      ['warning', 'Product line Fragrance: it moves, but receives SKUs of those axes only.'],
      ['warning', 'Product line Makeup: it moves, but receives SKUs of those axes only.'],
      ['skipped', 'Cancelled: tiers are not changed on closed or cancelled doors.'],
    ]);
    expect(rows[0]).toMatchObject({
      doorLabel: 'Mall of the South (from file)',
      change: '— → Premium',
      doorId: undefined,
    });
    expect(rows[1]).toMatchObject({ doorLabel: 'Alpha Store', change: 'Access → Premium Plus' });
    expect(rows[5]).toMatchObject({
      change: 'Needs tier → Expertise',
      tierId: 'T3',
      snapshot: { status: 'Pre-Trade' },
    });
    expect(rows[2].key).toBe('r2');
  });

  it('warns about project doors and passes ready rows', () => {
    const rows = checkRows(
      [fromDoor('D4', { value: 'Expertise' }), fromDoor('D1', { value: 'Expertise' })],
      'tier',
      data,
    );
    expect(summary(rows)).toEqual([
      [
        'warning',
        'Project door (MTP): the tier is saved; nothing goes to SAP until it is Pre-Trade.',
      ],
      ['ready', ''],
    ]);
    expect(rows[1].snapshot).toEqual({ tierId: 'T1', status: 'Open' });
  });

  it('keeps the last row for a door and labels files without a door name', () => {
    const rows = checkRows(
      [
        { line: 2, doorKey: 'US1001', value: 'Premium' },
        { line: 3, doorKey: 'US1001', value: 'Expertise' },
        { line: 4, doorKey: '', value: undefined },
      ],
      'tier',
      data,
    );
    expect(summary(rows)[0]).toEqual(['nochange', 'Replaced by a later row for this door.']);
    expect(rows[1].status).toBe('ready');
    expect(rows[2]).toMatchObject({ status: 'error', doorLabel: ' (from file)', change: '— → ' });
  });

  it('names an unset product line and treats a door with an unknown tier as Needs tier', () => {
    const odd = makeData({
      ...data.records,
      doors: [{ id: 'Z', name: 'Zulu', doorKey: 'US7', status: 'Open', tierId: 'GONE' }],
    });
    const [row] = checkRows([{ line: 2, doorKey: 'US7', value: 'Premium' }], 'tier', odd);
    expect(row).toMatchObject({
      status: 'warning',
      message: 'Product line not set: it moves, but receives SKUs of those axes only.',
      change: 'Needs tier → Premium',
    });
  });
});

describe('checkRows — SKUs (FR-041)', () => {
  const sku = (
    id: string,
    skuId: string | undefined,
    action: string,
    extra: Partial<RawRow> = {},
  ) =>
    fromDoor(id, {
      skuId,
      skuKey: skuId ? data.index.skuById.get(skuId)?.key : undefined,
      action,
      ...extra,
    });

  it('applies each rule in order', () => {
    const rows = checkRows(
      [
        { line: 2, doorKey: 'US9999', skuKey: '100005', action: 'Add' },
        { line: 3, doorKey: 'US1001', skuKey: '999999', action: 'Add' },
        { line: 4, doorKey: 'US1001', skuKey: '100005', action: 'Move' },
        sku('D3', 'S5', 'Add'),
        sku('D2', 'S5', 'Add'),
        sku('D1', 'S3', 'Add'),
        sku('D1', 'S2', 'Remove'),
        sku('D4', 'S5', 'Add'),
        sku('D4', 'S3', 'Remove'),
        sku('D1', 'S5', 'add'),
        sku('D1', 'S5', 'Add'),
        sku('D4', 'S1', 'REMOVE'),
      ],
      'sku',
      data,
    );
    expect(summary(rows)).toEqual([
      ['error', 'Door key not found in the door list.'],
      ['error', 'SKU key 999999 is not in the catalogue.'],
      ['error', 'Action must be Add or Remove.'],
      ['skipped', 'Closed.'],
      ['skipped', 'The door has no tier yet, so it has no assortment to change.'],
      ['skipped', 'Axis Makeup is not in the door’s product line (Fragrance).'],
      ['error', 'This door already has an exception for this SKU. Change it on the door.'],
      ['nochange', 'Already receives this SKU.'],
      ['nochange', 'Does not receive this SKU today.'],
      ['ready', ''],
      ['nochange', 'Duplicate of an earlier row.'],
      ['ready', ''],
    ]);
    expect(rows[9]).toMatchObject({
      change: 'Add 100005 · Chance',
      action: 'add',
      skuId: 'S5',
      skuKey: '100005',
    });
    expect(rows[11]).toMatchObject({ change: 'Remove 100001 · N°5 EDP', action: 'remove' });
    expect(rows[2].change).toBe('Move 100005 · Chance');
  });

  it('describes rows with missing values', () => {
    const odd = makeData({
      ...data.records,
      skus: [...data.records.skus, { id: 'SX', key: '100099' }],
      doors: [{ id: 'Z', name: 'Zulu', doorKey: 'US7', status: 'Open', tierId: 'T1' }],
    });
    const rows = checkRows(
      [
        { line: 2, doorKey: 'US7', skuKey: '100099', action: 'Add' },
        { line: 3, doorKey: 'US7', action: '' },
        { line: 4, doorKey: 'US7', skuKey: '100099' },
        { line: 5, doorKey: 'US7', skuKey: '100001', action: 'Remove' },
      ],
      'sku',
      odd,
    );
    expect(rows[3]).toMatchObject({
      status: 'nochange',
      message: 'Does not receive this SKU today.',
    });
    const [noValue] = checkRows([{ line: 2, doorKey: 'US7' }], 'tier', odd);
    expect(noValue.message).toBe('“” is not a tier. Use Access, Premium, Expertise.');
    expect(rows[0]).toMatchObject({
      status: 'skipped',
      message: 'Axis not set is not in the door’s product line (not set).',
      change: 'Add 100099',
    });
    expect(rows[1]).toMatchObject({ message: 'SKU key  is not in the catalogue.', change: '— ' });
    expect(rows[2].message).toBe('Action must be Add or Remove.');
  });

  it('exposes labels and tones for every status', () => {
    expect(STATUS_LABEL).toEqual({
      ready: 'Ready',
      warning: 'Warning',
      nochange: 'No change',
      skipped: 'Skipped',
      error: 'Error',
    });
    expect(STATUS_TONE.error).toBe('critical');
  });
});
