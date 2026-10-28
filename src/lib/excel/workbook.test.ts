import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildWorkbook, downloadWorkbook, loadExcel, saveFile, XLSX_MIME } from './workbook';

afterEach(() => {
  vi.restoreAllMocks();
});

const read = async (bytes: ArrayBuffer) => {
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(bytes);
  return wb;
};

describe('workbook', () => {
  it('writes sheets with a bold header, rows and list validations', async () => {
    const bytes = await buildWorkbook([
      {
        name: 'Update',
        columns: [{ header: 'Door key', width: 12 }, { header: 'New tier' }],
        rows: [
          ['US1542', 'Premium'],
          ['US1543', 3],
        ],
        validations: [{ column: 2, list: ['Access', 'Premium'], rows: 2500 }],
      },
      { name: 'Rules', columns: [{ header: 'Column' }], rows: [] },
    ]);
    const wb = await read(bytes);
    const sheet = wb.getWorksheet('Update')!;
    expect(sheet.getRow(1).values).toEqual([undefined, 'Door key', 'New tier']);
    expect(sheet.getRow(1).font?.bold).toBe(true);
    expect(sheet.getRow(3).values).toEqual([undefined, 'US1543', 3]);
    expect(sheet.getColumn(1).width).toBe(12);
    expect(sheet.getColumn(2).width).toBe(18);
    expect(sheet.getCell('B2501').dataValidation).toMatchObject({
      type: 'list',
      formulae: ['"Access,Premium"'],
    });
    expect(wb.getWorksheet('Rules')!.rowCount).toBe(1);
  });

  it('saves a file through a temporary link and revokes the URL', async () => {
    vi.useFakeTimers();
    const create = vi.fn(() => 'blob:x');
    const revoke = vi.fn();
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.download).toBe('Doors.xlsx');
      expect(this.href).toBe('blob:x');
    });
    saveFile('Doors.xlsx', new ArrayBuffer(1));
    expect(click).toHaveBeenCalledTimes(1);
    expect((create.mock.calls[0] as unknown as [Blob])[0].type).toBe(XLSX_MIME);
    expect(document.querySelector('a[download]')).toBeNull();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledWith('blob:x');
    vi.useRealTimers();
  });

  it('downloadWorkbook builds then saves', async () => {
    const create = vi.fn(() => 'blob:y');
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await downloadWorkbook('A.xlsx', [{ name: 'S', columns: [{ header: 'H' }], rows: [['v']] }]);
    const blob = (create.mock.calls[0] as unknown as [Blob])[0];
    const wb = await read(await blob.arrayBuffer());
    expect(wb.getWorksheet('S')!.getCell('A2').value).toBe('v');
  });
});
