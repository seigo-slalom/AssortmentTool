export interface SheetSpec {
  name: string;
  columns: readonly { header: string; width?: number }[];
  rows: readonly (readonly (string | number)[])[];
  /** Dropdown (list) validations on a 1-based column for data rows 2…`rows + 1`. */
  validations?: readonly { column: number; list: readonly string[]; rows: number }[];
}

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

interface ValidationList {
  add(range: string, validation: { type: 'list'; allowBlank: boolean; formulae: string[] }): void;
}

// exceljs is ~1 MB; it is only loaded the first time a workbook is built or read (R4).
export async function loadExcel() {
  return (await import('exceljs')).default;
}

const columnLetter = (n: number): string => {
  let s = '';
  for (let x = n; x > 0; x = Math.floor((x - 1) / 26))
    s = String.fromCharCode(65 + ((x - 1) % 26)) + s;
  return s;
};

/** Builds an .xlsx workbook in memory. Plain cells only; no brand colours leave token.ts. */
export async function buildWorkbook(sheets: readonly SheetSpec[]): Promise<ArrayBuffer> {
  const ExcelJS = await loadExcel();
  const workbook = new ExcelJS.Workbook();
  for (const spec of sheets) {
    const sheet = workbook.addWorksheet(spec.name);
    sheet.columns = spec.columns.map((c) => ({ header: c.header, width: c.width ?? 18 }));
    sheet.getRow(1).font = { bold: true };
    for (const row of spec.rows) sheet.addRow([...row]);
    // `dataValidations` exists on worksheets at runtime but is missing from exceljs' typings.
    const validations = (sheet as unknown as { dataValidations: ValidationList }).dataValidations;
    for (const v of spec.validations ?? []) {
      const col = columnLetter(v.column);
      validations.add(`${col}2:${col}${v.rows + 1}`, {
        type: 'list',
        allowBlank: true,
        formulae: [`"${v.list.join(',')}"`],
      });
    }
  }
  return (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
}

/** Saves bytes as a file through a temporary link; no network involved. */
export function saveFile(fileName: string, bytes: ArrayBuffer, type = XLSX_MIME): void {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function downloadWorkbook(
  fileName: string,
  sheets: readonly SheetSpec[],
): Promise<void> {
  saveFile(fileName, await buildWorkbook(sheets));
}
