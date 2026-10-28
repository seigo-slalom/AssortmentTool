# Contract: Shared Data, Doors Logic & Excel Modules

**Feature**: [../spec.md](../spec.md) · Types: [data-model.md](../data-model.md) ·
Decisions: [research.md](../research.md). Signatures are TypeScript-style and describe the
public surface each module exports; bodies are implementation detail.

## `src/lib/data/` (R1, R2, R7–R9)

```ts
fetchAllPages<T>(label: string, call: (o: IGetAllOptions) => Promise<IOperationResult<T[]>>, o: IGetAllOptions): Promise<T[]>   // moved from engine adapters; behaviour unchanged

loadAssortmentRecords(): Promise<AssortmentRecords>          // 5 tables, all-or-nothing
toEngineDataset(r: AssortmentRecords): EngineDataset          // ≡ engine loaders' mapping (equivalence test)
buildIndex(r: AssortmentRecords): AssortmentIndex
useAssortmentData(): UseQueryResult<AssortmentData>          // key ['assortment-data']
useInvalidateAssortmentData(): () => Promise<void>

withDoorTierOverrides(ds: EngineDataset, o: ReadonlyMap<string, string | undefined>): EngineDataset
withDoorExceptions(ds: EngineDataset, add: readonly EngineException[]): EngineDataset

setDoorTier(doorId: string, tierId: string | null): Promise<WriteResult>
createDoorException(input: NewDoorException): Promise<WriteResult<{ id: string }>>
cancelException(exceptionId: string): Promise<WriteResult>
recheckDoors(ids: readonly string[]): Promise<Map<string, { tierId?: string; status?: string }>>      // chunks of 50
recheckDoorExceptions(doorIds: readonly string[]): Promise<Map<string, ExceptionRecord[]>>          // chunks of 50

type WriteResult<T = void> = { ok: true; value: T } | { ok: false; error: string }
```

Invariants: no `fetch`/`axios`; only `src/generated/services/*`; never throws for a single
failed write (returns `ok: false`); load failure rejects (region error state).

## `src/lib/async/runPool.ts` (R9)

```ts
runPool<T, R>(items: readonly T[], worker: (item: T) => Promise<R>, opts: { concurrency?: number /*4*/; onProgress?: (done: number, total: number) => void }): Promise<R[]>
```

Order of results = order of items; concurrency never exceeded (unit-tested).

## `src/lib/doors/` (R11, R12)

```ts
statusCategory(text?: string): 'open'|'pre-trade'|'project'|'closed'|'other'
statusTone(cat): 'success'|'info'|'neutral'|'unavailable'
buildDoorRows(data: AssortmentData): DoorRow[]
SAVED_FILTERS: readonly { id: SavedFilterId; label: string }[]       // Doors order: needs-tier, fragrance-only, recent, closed
BULK_SAVED_FILTERS: readonly SavedFilterId[]                          // needs-tier, recent, fragrance-only
matchesSavedFilter(row: DoorRow, id: SavedFilterId, today: Date): boolean
filterDoors(rows: readonly DoorRow[], q: DoorQuery, today: Date): DoorRow[]
sortDoors(rows: readonly DoorRow[], sort: DoorSort, dir: 'asc'|'desc'): DoorRow[]
parseDoorQuery(sp: URLSearchParams): DoorQuery;  stringifyDoorQuery(q: DoorQuery): string
filterOptions(rows: readonly DoorRow[]): { distributors, onlineOffline, doorTypes, productLines, statuses }
DOOR_COLUMNS: readonly { key: string; title: string }[]               // single source for grid + export
doorCellText(row: DoorRow, key: string): string | number | ''         // used by export
```

## `src/lib/session/` (R6)

```ts
doorSelection: { get(): ReadonlySet<string>; set(ids: Iterable<string>): void; clear(): void; subscribe(fn): () => void }
useDoorSelection(): [ReadonlySet<string>, (ids: Iterable<string>) => void]
lastDoorsSearch / bulkIntroHidden: same store pattern
```

## `src/lib/excel/` (R4, R13) — exceljs loaded via dynamic import only

```ts
downloadWorkbook(fileName: string, sheets: readonly SheetSpec[]): Promise<void>
type SheetSpec = { name: string; columns: { header: string; width?: number }[]; rows: (string | number | '')[][];
                   validations?: { column: number; list: readonly string[] }[] }
readTable(file: File): Promise<{ headers: string[]; rows: { line: number; cells: Record<string, string> }[] }>   // .xlsx via exceljs, .csv via parseCsv
parseCsv(text: string): string[][]                                    // RFC 4180
validateUploadFile(file: File, maxRows: number): Promise<{ ok: true } | { ok: false; message: string }>
```

Messages: wrong type → "Upload an .xlsx or .csv file."; empty → "The file has no rows.";
too many → "The file has {n} rows. The limit is {max}."; missing required header →
"Column “{name}” is missing.".

## `src/features/bulk-update/` (pure parts)

```ts
bulkReducer(state: BulkState, action: BulkAction): BulkState
buildRawRows(state: BulkState, data: AssortmentData, today: Date): RawRow[]
checkRows(raw: readonly RawRow[], type: 'tier'|'sku', data: AssortmentData): CheckedRow[]     // FR-040 / FR-041
computeImpact(applicable: readonly CheckedRow[], type, data: AssortmentData): { rows: ImpactRow[]; kpis: Kpis; sentence: string }
applyBulk(applicable, type, reason, deps): Promise<BulkResult>        // recheck → runPool writes
undoBulk(result: BulkResult, deps): Promise<BulkResult>
TEMPLATE_COLUMNS: Record<'tier'|'sku', readonly { col: string; required: boolean; rule: string }[]>
```

`deps` = the `lib/data` mutation/recheck functions (injected for tests).
