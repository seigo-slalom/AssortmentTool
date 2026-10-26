# Data Model: Assortment Engine Core

Plain, immutable-by-convention objects. IDs are GUID strings; absent values are
`undefined` (never `''`). Source field mapping is in the right-hand column.

## Engine inputs (`core/types.ts`)

| Type              | Field                                       | Notes / source                                       |
| ----------------- | ------------------------------------------- | ---------------------------------------------------- |
| `EngineDoor`      | `id: string`                                | `cr380_doorid`                                       |
|                   | `tierId?: string`                           | `_cr380_tierid_value`                                |
|                   | `productLine?: string`                      | `cr380_productline` (single value; compared whole)   |
|                   | `distributorNameCode?: string`              | `cr380_distributornamecode` (retailer key)           |
| `EngineTier`      | `id: string`                                | `cr380_tierid`                                       |
| `EngineSku`       | `id: string`                                | `cr380_skuid`                                        |
|                   | `axis?: string`                             | `cr380_axis`                                         |
|                   | `active: boolean`                           | adapters supply `true` (filtered at source)          |
| `EngineTierRule`  | `id: string`                                | `cr380_tierruleid`                                   |
|                   | `tierId: string`                            | `_cr380_tierid_value`                                |
|                   | `skuId: string`                             | `_cr380_sku_value`                                   |
|                   | `enabled: boolean`                          | adapters supply `true` (filtered at source)          |
| `EngineException` | `id: string`                                | `cr380_assortmentexceptionid`                        |
|                   | `level: 'door' \| 'retailer'`               | `cr380_exceptionlevel` (860080000 / 860080001)       |
|                   | `action: 'add' \| 'remove'`                 | `cr380_exceptionaction` (860080000 / 860080001)      |
|                   | `skuId: string`                             | `_cr380_skuid_value`                                 |
|                   | `doorId?: string`                           | `_cr380_doorid_value` (door level)                   |
|                   | `distributorNameCode?: string`              | `cr380_distributornamecode` (retailer level)         |
|                   | `active: boolean`                           | adapters supply `true` (status Active, state active) |
| `EngineDataset`   | `doors, tiers, skus, tierRules, exceptions` | arrays of the above                                  |

## Derived structures (never persisted; in memory only)

| Structure        | Shape                                                                                                                                                                                                                                                        | Lifetime                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `EngineIndex`    | `skuIdxById: Map<string, number>`, `skuIds: string[]`, `axisByIdx: (string \| undefined)[]`, `doorById`, `tierRuleSkus: Map<tierId, {enabled: Set<skuIdx>, disabled: Set<skuIdx>}>`, `doorExceptions`, `retailerExceptions`, `diagnostics`                   | built once per dataset                           |
| `BaseAssortment` | `{ bits: Uint32Array, count: number }`                                                                                                                                                                                                                       | cached per (tierId, productLine), created lazily |
| `Diagnostics`    | `{ ignoredExceptions: Record<DiagnosticCause, number> }` where cause ∈ `inactive`, `cancelled-or-inactive-state`, `missing-level`, `missing-action`, `missing-sku`, `door-level-without-door`, `retailer-level-without-code`, `unavailable-sku`, `duplicate` | with index                                       |

## Results (transient, per request)

| Type              | Fields                                                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DoorAssortment`  | `doorId`, `status: 'ok' \| 'tier-missing'`, `skuIds: string[]`, `reasons: ReasonCode[]` (parallel to `skuIds`), `count`                                                                           |
| `DoorLookup`      | `{ found: true; assortment } \| { found: false; reason: 'DOOR_NOT_FOUND' }`                                                                                                                       |
| `Explanation`     | `doorId`, `skuId`, `inAssortment: boolean`, `reason: ReasonCode`, `baseReason: ReasonCode`, `applied?: ExceptionRef`, `overridden?: ExceptionRef[]`, `notApplied?: ExceptionRef[]` (tier missing) |
| `ExceptionRef`    | `id`, `level`, `action`                                                                                                                                                                           |
| `AggregateCounts` | `byPair: { tierId, productLine, baseCount, doorCount }[]`, `byDoor: Map<doorId, number>`, `total: number`                                                                                         |

## Reason codes (`core/reasons.ts`)

`IN_TIER_RULES`, `ADDED_BY_DOOR_EXCEPTION`, `ADDED_BY_RETAILER_EXCEPTION`,
`TIER_MISSING`, `NOT_IN_TIER_RULES`, `RULE_DISABLED`, `SKU_INACTIVE`,
`SKU_NOT_AVAILABLE`, `AXIS_MISMATCH`, `REMOVED_BY_DOOR_EXCEPTION`,
`REMOVED_BY_RETAILER_EXCEPTION`.

## Validation / state rules

- Tier missing = `door.tierId` undefined or not in `tiers` → empty, exceptions not applied.
- Base membership = SKU active ∧ ∃ enabled rule for tier ∧ `sku.axis === door.productLine`
  (both defined; strict equality, no normalization).
- Effective outcome for (door, sku): Door-level entry → else Retailer-level entry (match
  `door.distributorNameCode` exactly) → else base. Same level: Remove beats Add.
- An exception on an inactive/unknown SKU never changes membership.
- Malformed/inactive exceptions are dropped at index build and counted in `diagnostics`.
- Counts: `doorCount = base.count + Σ(adds not in base) − Σ(removes in base)` over the
  door's effective exceptions only (no list built).
