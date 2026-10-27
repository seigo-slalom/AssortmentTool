// Deterministic stand-in for `@microsoft/power-apps/data`, aliased only in `vite --mode e2e`
// (vite.config.ts; specs/003-doors-screen/research.md R16). It serves an in-memory copy of
// e2e/fixtures/dataset.ts and supports exactly the OData subset src/lib/data uses.
//
// `?data=` flags: error (reads fail), slow (reads delayed), empty (no doors),
// writefail (every write fails), throttle (every 3rd write fails with 429).
import type { IOperationOptions, IOperationResult } from '@microsoft/power-apps/data';
import { createDataset, type Row } from './dataset';

type Flag = 'error' | 'slow' | 'empty' | 'writefail' | 'throttle' | null;

const flag = (): Flag => new URLSearchParams(window.location.search).get('data') as Flag;

const PRIMARY: Record<string, string> = {
  cr380_tiers: 'cr380_tierid',
  cr380_skus: 'cr380_skuid',
  cr380_tierrules: 'cr380_tierruleid',
  cr380_doors: 'cr380_doorid',
  cr380_assortmentexceptions: 'cr380_assortmentexceptionid',
};

const data = createDataset();
if (flag() === 'empty') data.cr380_doors = [];
let created = 0;
let writes = 0;

declare global {
  interface Window {
    __e2eData?: Record<string, Row[]>;
  }
}
window.__e2eData = data;

// ---- filter expressions: field eq|ne value, and, or, parentheses -------------------------

type Token = { kind: 'word' | 'string' | '(' | ')'; value: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const re = /\s*(?:(\()|(\))|'((?:[^']|'')*)'|([^\s()']+))/gy;
  let match: RegExpExecArray | null;
  while (re.lastIndex < input.length && (match = re.exec(input))) {
    if (match[1]) tokens.push({ kind: '(', value: '(' });
    else if (match[2]) tokens.push({ kind: ')', value: ')' });
    else if (match[3] !== undefined)
      tokens.push({ kind: 'string', value: match[3].replace(/''/g, "'") });
    else if (match[4]) tokens.push({ kind: 'word', value: match[4] });
  }
  return tokens;
}

const literal = (token: Token): unknown => {
  if (token.kind === 'string') return token.value;
  if (token.value === 'null') return null;
  if (token.value === 'true') return true;
  if (token.value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(token.value)) return Number(token.value);
  return token.value;
};

type Predicate = (row: Row) => boolean;

function parse(tokens: Token[]): Predicate {
  let pos = 0;
  const peek = () => tokens[pos];
  const orExpr = (): Predicate => {
    let left = andExpr();
    while (peek()?.value === 'or') {
      pos += 1;
      const l = left;
      const r = andExpr();
      left = (row) => l(row) || r(row);
    }
    return left;
  };
  const andExpr = (): Predicate => {
    let left = primary();
    while (peek()?.value === 'and') {
      pos += 1;
      const l = left;
      const r = primary();
      left = (row) => l(row) && r(row);
    }
    return left;
  };
  const primary = (): Predicate => {
    if (peek()?.kind === '(') {
      pos += 1;
      const inner = orExpr();
      pos += 1;
      return inner;
    }
    const field = tokens[pos].value;
    const op = tokens[pos + 1].value;
    const value = literal(tokens[pos + 2]);
    pos += 3;
    const get = (row: Row) => row[field] ?? null;
    return op === 'ne' ? (row) => get(row) !== value : (row) => get(row) === value;
  };
  return orExpr();
}

const matches = (filter?: string): Predicate => (filter ? parse(tokenize(filter)) : () => true);

// ---- client -------------------------------------------------------------------------------

const ok = <T>(value: T, skipToken?: string): IOperationResult<T> => ({
  success: true,
  data: value,
  skipToken,
});
const fail = <T>(message: string): IOperationResult<T> => ({
  success: false,
  data: undefined as T,
  error: new Error(message),
});

const delay = () =>
  flag() === 'slow' ? new Promise((r) => setTimeout(r, 1500)) : Promise.resolve();

const ANNOTATION = '@OData.Community.Display.V1.FormattedValue';

// Like Dataverse: only selected columns (plus their formatted-value annotations) come back.
const pick = (row: Row, select?: string[]): Row => {
  if (!select) return { ...row };
  const out: Row = {};
  for (const key of select) {
    out[key] = row[key] ?? null;
    if (`${key}${ANNOTATION}` in row) out[`${key}${ANNOTATION}`] = row[`${key}${ANNOTATION}`];
  }
  return out;
};

// Like Dataverse: selecting a column the table does not have fails the whole request.
function unknownColumn(table: string, select?: string[]): string | undefined {
  const known = new Set((data[table] ?? []).flatMap((row) => Object.keys(row)));
  return select?.find((key) => known.size > 0 && !known.has(key));
}

const throttled = new Set<string>();

// `throttle` fails every 3rd write once; retrying the same record then succeeds (transient 429).
function writeFailure(key: string): string | null {
  writes += 1;
  if (flag() === 'writefail') return 'Stubbed write failure';
  if (flag() === 'throttle' && writes % 3 === 0 && !throttled.has(key)) {
    throttled.add(key);
    return '429 Too Many Requests';
  }
  return null;
}

// `@odata.bind` keys write the lookup's `_x_value`; "/set(id)" → id, null clears it.
function applyChanges(row: Row, changes: Row): void {
  for (const [key, value] of Object.entries(changes)) {
    const bind = /^(\w+)@odata\.bind$/.exec(key);
    if (bind) {
      const id = typeof value === 'string' ? (/\(([^)]+)\)/.exec(value)?.[1] ?? null) : null;
      row[`_${bind[1].toLowerCase()}_value`] = id;
    } else {
      row[key] = value;
    }
  }
  row.modifiedon = new Date().toISOString();
  row[`_modifiedby_value${ANNOTATION}`] = 'E2E Tester';
}

const client = {
  async retrieveMultipleRecordsAsync<T>(table: string, options: IOperationOptions = {}) {
    await delay();
    if (flag() === 'error') return fail<T[]>('Stubbed data failure');
    const unknown = unknownColumn(table, options.select);
    if (unknown)
      return fail<T[]>(`Could not find a property named '${unknown}' on type '${table}'.`);
    const rows = (data[table] ?? []).filter(matches(options.filter));
    const size = options.top ?? options.maxPageSize ?? rows.length;
    const start = options.skipToken ? Number(options.skipToken) : 0;
    const page = rows.slice(start, start + size).map((row) => pick(row, options.select));
    const next = !options.top && start + size < rows.length ? String(start + size) : undefined;
    return ok(page as T[], next);
  },
  async retrieveRecordAsync<T>(table: string, id: string, options: IOperationOptions = {}) {
    await delay();
    const row = (data[table] ?? []).find((r) => r[PRIMARY[table]] === id);
    return row ? ok(pick(row, options.select) as T) : fail<T>('Record not found');
  },
  async createRecordAsync<TIn, TOut>(table: string, record: TIn) {
    const failure = writeFailure(`${table}:${JSON.stringify(record)}`);
    if (failure) return fail<TOut>(failure);
    created += 1;
    const row: Row = { [PRIMARY[table]]: `NEW-${created}`, statecode: 0 };
    applyChanges(row, record as Row);
    data[table].push(row);
    return ok({ ...row } as TOut);
  },
  async updateRecordAsync<TIn, TOut>(table: string, id: string, changes: TIn) {
    const failure = writeFailure(`${table}:${id}:${JSON.stringify(changes)}`);
    if (failure) return fail<TOut>(failure);
    const row = data[table].find((r) => r[PRIMARY[table]] === id);
    if (!row) return fail<TOut>('Record not found');
    applyChanges(row, changes as Row);
    return ok({ ...row } as TOut);
  },
  async deleteRecordAsync(table: string, id: string) {
    data[table] = data[table].filter((r) => r[PRIMARY[table]] !== id);
    return ok(undefined);
  },
  async executeAsync<T>() {
    return fail<T>('Not supported by the e2e data stub');
  },
};

export function getClient() {
  return client;
}

export function serializeMultiSelectPicklistFields<T>(value: T): T {
  return value;
}

export function deserializeMultiSelectPicklistFields<T>(value: T): T {
  return value;
}
