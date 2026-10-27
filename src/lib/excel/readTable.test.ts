import { describe, expect, it } from 'vitest';
import { cell, readTable, readUpload, uploadKind } from '.';
import { buildWorkbook } from './workbook';

const xlsx = async (rows: (string | number)[][], name = 'f.xlsx') =>
  new File(
    [
      await buildWorkbook([
        {
          name: 'Update',
          columns: rows[0].map((h) => ({ header: String(h) })),
          rows: rows.slice(1),
        },
      ]),
    ],
    name,
  );

const csv = (text: string, name = 'f.csv') => new File([text], name, { type: 'text/csv' });

const TIER = { maxRows: 3, requiredHeaders: ['Door key', 'New tier'] };

describe('readTable', () => {
  it('reads the first .xlsx sheet with row numbers, skipping blank rows', async () => {
    const table = await readTable(
      await xlsx([
        ['Door key', 'New tier', ''],
        [' US1001 ', 'Premium', 'x'],
        ['', '', ''],
        ['US1002', 3, ''],
      ]),
    );
    expect(table.headers).toEqual(['Door key', 'New tier']);
    expect(table.rows).toEqual([
      { line: 2, cells: { 'Door key': 'US1001', 'New tier': 'Premium' } },
      { line: 4, cells: { 'Door key': 'US1002', 'New tier': '3' } },
    ]);
  });

  it('reads .csv files with the header as row 1', async () => {
    const table = await readTable(csv('Door key,New tier\nUS1,Access\n\nUS2,\nUS3\n'));
    expect(table.rows).toEqual([
      { line: 2, cells: { 'Door key': 'US1', 'New tier': 'Access' } },
      { line: 4, cells: { 'Door key': 'US2', 'New tier': '' } },
      { line: 5, cells: { 'Door key': 'US3', 'New tier': '' } },
    ]);
  });

  it('handles an empty csv', async () => {
    expect(await readTable(csv(''))).toEqual({ headers: [], rows: [] });
  });

  it('detects the upload kind', () => {
    expect(uploadKind('A.XLSX')).toBe('xlsx');
    expect(uploadKind('a.csv')).toBe('csv');
    expect(uploadKind('a.xls')).toBeNull();
  });
});

describe('readUpload', () => {
  it('accepts a valid file', async () => {
    const result = await readUpload(csv('door key,NEW TIER\nUS1,Access\n'), TIER);
    expect(result.ok).toBe(true);
    if (result.ok) expect(cell(result.table.rows[0].cells, 'New tier')).toBe('Access');
  });

  it.each([
    [csv('x', 'a.txt'), 'Upload an .xlsx or .csv file.'],
    [csv('Door key\nUS1\n'), 'Column “New tier” is missing.'],
    [csv('Door key,New tier\n'), 'The file has no rows.'],
    [csv('Door key,New tier\n1,a\n2,a\n3,a\n4,a\n'), 'The file has 4 rows. The limit is 3.'],
    [
      new File(['not a zip'], 'bad.xlsx'),
      'The file could not be read. Check that it is a valid .xlsx or .csv file.',
    ],
  ])('rejects %#', async (file, message) => {
    await expect(readUpload(file, TIER)).resolves.toEqual({ ok: false, message });
  });

  it('looks up cells case-insensitively and returns empty for missing ones', () => {
    expect(cell({ 'Door Key': 'US1' }, 'door key')).toBe('US1');
    expect(cell({}, 'Reason')).toBe('');
  });
});
