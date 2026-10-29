# Contract: Tier Assortments UI and Logic

## Route

`#/tier-assortments` (existing screen id `tier-assortments`); optional query
`?tier=<tierId>` selects the tier (deep link). Title "Tier assortments", eyebrow "Strategy".

## Page anatomy (prototype `vAssortment`)

1. `PageHeader` — description "Pick a tier, then tick the SKUs it carries. Every eligible
   door in the tier receives the result."; action **Export** (download icon).
2. Layout grid: `232px minmax(0,1fr)`; single column below 1100 px.
3. `<nav aria-label="Cluster tiers">` — label "Tiers · N"; one button per tier
   (`aria-current="page"` when selected) with name, rank "01", "N doors · N SKUs",
   "● N unsaved changes"; footer button "Manage tiers" (settings icon).
4. `<section aria-labelledby="as-tier-title">` — h2 tier name, summary line, **Edit tier**
   (edit icon); filter row: search ("Search SKU or product group", 210px), Axis select
   ("All axes", 130px), SKU type multi-select ("Retail and SPM", 170px), Segmented
   "All (n) / In tier (n) / Not in tier (n)" (`aria-label="Which SKUs to show"`).
5. Attention row: "Needs attention" + chip (`aria-pressed`), closable focus tag,
   right-aligned link "Expand all"/"Collapse all".
6. Scroll list (max-height `max(360px, calc(100vh - 290px))`) with sticky ink header
   columns: ☐ · Product group · In <Tier> · Flags · SKUs. Group rows and indented SKU rows
   use the grid `40px minmax(0,2.4fr) minmax(130px,1fr) minmax(0,1.3fr) 72px`.
7. Footnote: "N product groups · N SKUs shown. A door receives a SKU only when…".
8. Sticky staging bar (only with staged changes): text + **Discard** + **Review and save**.

## Dialogs / drawers

- **Save** modal (560): title "Save N tier changes", grid SKU · Tier · Change · Doors,
  `ReasonField` "Why is this change being made?" (required, 280, placeholder "For example:
  Sublimage La Crème Fine launch"); ok "Save changes" (disabled until reason), cancel "Keep
  editing".
- **Manage tiers** drawer (560): intro text, grid Rank · Tier · Doors · SKUs · Edit/Retire;
  footer Close + primary "Add a tier".
- **Tier form** modal (560): Add / Edit / Retire per spec US5, "What happens" box, reason
  field; Retire ok button is danger.
- **SKU drawer** (560): Descriptions (bordered, 1 column), "Where it's distributed" grid,
  "Exceptions" grid.

## Messages (toast)

- Group toggle: "N <Group> SKUs staged to join|leave <Tier>. Review and save below." /
  "Nothing to change in <Group>."
- Save: "N changes saved · ±N door assortments, shown everywhere straight away."
- Export: "Tier assortments exported · N SKUs × N tiers".
- Add / edit / retire: prototype wording without Activity/SAP references ("Bulk Update"
  replaces "Mass update").

## Logic API (`src/lib/tiers/`, pure, unit tested)

```ts
buildMembership(rules): Map<string, Set<string>>
tierSummaries(data, staged): TierSummary[]
filterSkus(skus, filters, effective): SkuRecord[]
buildGroups(skus, tierId, ctx): ProductGroup[]
stageOne(staged, skuId, tierId, checked, saved): Staged
stageMany(staged, skuIds, tierId, checked, savedFn): { staged, changed }
eligibleTierDoors(index, tierId, sku): number
stagedImpact(staged, ctx): StagedImpact
isNewSku(sku, membership, addExceptionSkuIds): boolean
validateTierForm(form, tiers): { ok, nameError? }
tierFormImpact(form, ctx): string[]
rewriteRanks(tiers, movedId, afterId): { id, rank }[]
exportRows(skus, tiers, membership): string[][]
```

## Write API (`src/lib/data/mutations.ts` additions)

```ts
enableTierRule(tierId, skuId): Promise<WriteResult>      // re-enable or create
disableTierRule(ruleId): Promise<WriteResult>
createTier({ name, description, rank }): Promise<WriteResult<{ id }>>
updateTier(id, patch: { name?, description?, rank?, active? }): Promise<WriteResult>
```

All return `WriteResult`; orchestration (`saveStaged`, `saveTierForm`) lives in the feature
and uses `runPool`, then `useInvalidateAssortmentData()`.
