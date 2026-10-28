import { readTable, uploadKind, type Table } from './readTable';

export type UploadResult = { ok: true; table: Table } | { ok: false; message: string };

/**
 * Checks and reads an uploaded file before any row is checked: type, required columns,
 * at least one row, and the row limit (contracts/data-and-logic.md messages).
 */
export async function readUpload(
  file: File,
  { maxRows, requiredHeaders }: { maxRows: number; requiredHeaders: readonly string[] },
): Promise<UploadResult> {
  if (!uploadKind(file.name)) return { ok: false, message: 'Upload an .xlsx or .csv file.' };
  let table: Table;
  try {
    table = await readTable(file);
  } catch {
    return {
      ok: false,
      message: 'The file could not be read. Check that it is a valid .xlsx or .csv file.',
    };
  }
  const headers = new Set(table.headers.map((h) => h.toLowerCase()));
  const missing = requiredHeaders.find((h) => !headers.has(h.toLowerCase()));
  if (missing) return { ok: false, message: `Column “${missing}” is missing.` };
  if (!table.rows.length) return { ok: false, message: 'The file has no rows.' };
  if (table.rows.length > maxRows) {
    return {
      ok: false,
      message: `The file has ${table.rows.length.toLocaleString('en-US')} rows. The limit is ${maxRows.toLocaleString('en-US')}.`,
    };
  }
  return { ok: true, table };
}

/** Case-insensitive cell lookup by header name. */
export function cell(cells: Record<string, string>, header: string): string {
  const key = Object.keys(cells).find((k) => k.toLowerCase() === header.toLowerCase());
  return key ? cells[key] : '';
}
