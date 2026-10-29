# Data Model: Tier Assortments Screen

## Persisted records (Dataverse, via generated services)

| Record (lib/data) | Table                        | Fields used (new in **bold**)                                                                                                                                                | Writes                                            |
| ----------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `TierRecord`      | `cr380_tiers`                | id, name, rank, active, **description**                                                                                                                                      | create, update (name, description, rank, status)  |
| `SkuRecord`       | `cr380_skus`                 | id, key, name, axis, franchise, line, type, **barcode, masterProductName, masterProductBaseline, masterFranchise, masterCategory, category, subcategory, lastSeenInSunrise** | none                                              |
| `TierRuleRecord`  | `cr380_tierrules`            | id, tierId, skuId (enabled only)                                                                                                                                             | create (enabled), update `cr380_isenabled`        |
| `DoorRecord`      | `cr380_doors`                | tierId, productLine, onlineOffline, status                                                                                                                                   | update tier (retire move, existing `setDoorTier`) |
| `ExceptionRecord` | `cr380_assortmentexceptions` | level, action, doorId, skuId, distributorNameCode, reason                                                                                                                    | none                                              |

Validation: tier name 1–30 chars, unique (case-insensitive) among active tiers; reason
1–280 chars (session only, not persisted — spec FR-018).

### State transitions

- Tier rule: _(none)_ → Enabled (add) · Enabled → Disabled (remove / tier retired) ·
  Disabled → Enabled (re-add).
- Tier: Active → Inactive (retire; requires door destination when it has doors and ≥2
  active tiers).

## Derived / view models (lib/tiers, pure)

- **TierSummary**: `{ id, name, description, rank (1..N display "01"), doorCount,
retailSkus, spmSkus, stagedCount }`.
- **Membership index**: `Map<skuId, Set<tierId>>` from enabled rules.
- **ScreenFilters**: `{ tierId, search, axis?, types: SkuType[], show: 'all'|'in'|'out',
focus: 'fresh'|null, open: Record<groupKey, boolean> }`.
- **ProductGroup**: `{ key: "axis|franchise", axis, name, skus, total, inCount, pct,
retail, spm, stagedCount, newCount, checked, indeterminate, disabled, addOnToggle }`.
- **SkuRow**: `{ sku, saved, effective, staged?: 'add'|'remove', alsoIn: string[], isNew }`.
- **Staged**: `Record<"skuId|tierId", boolean>` (true = add, false = remove).
- **StagedImpact**: `{ changes, tiers, doorDelta }` where each change contributes
  ±`eligibleTierDoors(tierId, sku)`.
- **TierForm**: `{ mode: 'add'|'edit'|'retire', tierId?, name, description, after (tierId |
0 = first), start: 'copy'|'empty', copyFrom?, moveTo?, reason }` with `validateTierForm` →
  `{ ok, nameError? }` and `tierFormImpact` → string[].
- **RetireImpact**: `{ doors, avgSkuDelta }` computed from base assortments per
  (tier, product line).
- **ExportRow**: `[SKU key, SKU name, Franchise, Line, Axis, SKU type, ...tier "Yes"|""]`.

## Definitions

- **New SKU (needs attention)**: active SKU with no enabled tier rule and no active
  add exception.
- **Eligible door**: active door in the tier whose product line equals the SKU axis; any
  active door in the tier for Multi-axis SKUs.
- **Reach (drawer)**: per active tier, doors whose derived assortment includes the SKU,
  split Brick & Mortar (offline) / E-business (online).
