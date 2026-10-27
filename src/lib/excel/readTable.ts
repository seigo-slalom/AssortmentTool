import { parseCsv } from './parseCsv';
import { loadExcel } from './workbook';

export interface TableRow {
  /** Row number in the file (the header is row 1). */
  line: number;
  /** Cell text by trimmed header name. */
  cells: Record<string, string>;
}

export interface Table {
  headers: string[];
  rows: TableRow[];
}

export type UploadKind = 'xlsx' | 'csv';

export function uploadKind(fileName: string): UploadKind | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.xlsx')) return 'xlsx';
  if (lower.endsWith('.csv')) return 'csv';
  return null;
}

const isBlank = (cells: readonly string[]) => cells.every((c) => c.trim() === '');

function toTable(matrix: readonly (readonly string[])[], lines: readonly number[]): Table {
  const headers = (matrix[0] ?? []).map((h) => h.trim());
  const rows: TableRow[] = [];
  matrix.slice(1).forEach((cells, i) => {
    if (isBlank(cells)) return;
    const record: Record<string, string> = {};
    headers.forEach((header, c) => {
      if (header) record[header] = (cells[c] ?? '').trim();
    });
    rows.push({ line: lines[i + 1], cells: record });
  });
  return { headers: headers.filter(Boolean), rows };
}

/** Reads the first sheet of an .xlsx file, or a .csv file, into header-keyed rows. */
export async function readTable(file: File): Promise<Table> {
  if (uploadKind(file.name) === 'csv') {
    const matrix = parseCsv(await file.text());
    return toTable(
      matrix,
      matrix.map((_, i) => i + 1),
    );
  }
  const ExcelJS = await loadExcel();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.worksheets[0];
  const matrix: string[][] = [];
  const lines: number[] = [];
  sheet?.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const cells: string[] = [];
    for (let c = 1; c <= row.cellCount; c += 1) cells.push(row.getCell(c).text);
    matrix.push(cells);
    lines.push(rowNumber);
  });
  return toTable(matrix, lines);
}
