# Feature Specification: Assortment Engine Core

**Feature Branch**: N/A (no branch hook configured; spec directory `specs/001-assortment-engine-core`)

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "Assortment Engine core (no UI). Pure TypeScript functions in src/features/engine/ that derive a door's assortment from Door, Tier, Tier rule, SKU, and Assortment exception inputs (plain typed objects mapped from the generated models by adapters). Rules: (1) resolve the door's tier; (2) collect that tier's rules (SKUs); (3) keep a SKU only when its Axis exactly equals the door's Product Line (case-sensitive, no trimming); (4) apply add/remove exceptions, where Door-level beats Retailer-level, and retailer exceptions match the door's distributor name code. Each result must include the reason a SKU is in or out (excluded by axis, added by exception, etc.). Also set up Vitest coverage with 100% thresholds (excluding src/generated/**, main.tsx, type-only files, and test files). Must cover missing tier, inactive SKUs, disabled tier rules, near miss product lines, and conflicting exceptions. Storage and loading: door assortments are derived and never stored (no new table, no browser storage). Adapters load only the engine-required columns via the generated services, filtered on the server to active/enabled records, handling Dataverse paging. The engine builds a lookup index once per dataset, calculates and reuses a base assortment per (Tier, Product Line) pair, and applies each door's exceptions on top. Results hold SKU IDs plus reason codes, not SKU copies. Calculate lazily for the selected or visible doors, and calculate counts per (Tier, Product Line) pair for aggregates. Meet the 200 ms per-door target."

## User Scenarios & Testing _(mandatory)_

The "users" of this feature are (a) the in-scope screens that will later be built on top
of the engine (Overview, Doors, Mass update, Tier assortments, Exceptions) and (b) the
business testers who use those screens to verify how a door's assortment is derived. This
feature delivers no UI; every story is verified through automated tests against the
engine's public functions.

### User Story 1 - Derive a door's base assortment with reasons (Priority: P1)

Given a door, the engine returns the list of SKUs assorted to that door based on its tier
and product line, and for any SKU it can state why that SKU is in or out of the door's
assortment.

**Why this priority**: This is the core business rule the whole Assortment Tool exists to
validate. Without it no screen can show a door's assortment or explain it.

**Independent Test**: Supply an in-memory dataset of doors, tiers, tier rules, and SKUs
(no exceptions) and confirm that each door's derived SKU list and per-SKU reasons match a
hand-computed expectation.

**Acceptance Scenarios**:

1. **Given** a door assigned to Tier A with Product Line `Fragrance`, and Tier A has
   enabled rules for SKUs 1, 2, 3 whose Axis values are `Fragrance`, `Fragrance`,
   `Makeup`, **When** the door's assortment is derived, **Then** it contains SKUs 1 and 2
   with reason "in tier rules", and SKU 3 is out with reason "axis mismatch".
2. **Given** a door with Product Line `Fragrance` and a tier rule SKU whose Axis is
   `fragrance`, `Fragrance ` (trailing space), or ` Fragrance` (leading space), **When**
   the assortment is derived, **Then** that SKU is out with reason "axis mismatch"
   (near-miss values never match).
3. **Given** a door with no tier assigned, or whose tier is not in the loaded dataset,
   **When** the assortment is derived, **Then** the assortment is empty and every SKU
   reports reason "tier missing" (exceptions do not apply; see User Story 2, scenario 7).
4. **Given** a SKU that is not referenced by any rule of the door's tier, **When** asked
   why it is not assorted, **Then** the engine reports "not in tier rules".
5. **Given** an input dataset that contains an inactive SKU or a disabled/inactive tier
   rule (e.g., supplied directly in tests), **When** the assortment is derived, **Then**
   the SKU is out with reason "SKU inactive" or "rule disabled" respectively.
6. **Given** a SKU identifier that is not present in the loaded dataset, **When** asked
   why it is not assorted, **Then** the engine reports "SKU not available" (unknown or
   filtered out as inactive at load).

---

### User Story 2 - Apply Door- and Retailer-level exceptions (Priority: P1)

The engine adjusts the base assortment with Assortment exceptions: "Add" exceptions
include a SKU, "Remove" exceptions exclude it. Exceptions are recorded either for a
specific door (Door-level) or for a retailer (Retailer-level), where a Retailer-level
exception applies to every door whose distributor name code exactly equals the
exception's distributor name code. When both levels address the same door × SKU, the
Door-level exception wins.

**Why this priority**: Exceptions are how the business deviates from tier defaults; an
assortment without them is wrong for any door that has one, and the precedence rule is a
constitution-mandated behaviour.

**Independent Test**: Extend the Story 1 dataset with exceptions and confirm each
affected door × SKU outcome and reason, including conflicting cases.

**Acceptance Scenarios**:

1. **Given** SKU 3 is out of a door's base assortment due to axis mismatch and the door
   has an active Door-level "Add" exception for SKU 3, **When** derived, **Then** SKU 3 is
   in with reason "added by door exception" and the underlying base reason ("axis
   mismatch") is also reported.
2. **Given** SKU 1 is in a door's base assortment and an active Retailer-level "Remove"
   exception for SKU 1 exists with the door's distributor name code, **When** derived,
   **Then** SKU 1 is out with reason "removed by retailer exception".
3. **Given** a Retailer-level "Remove" and a Door-level "Add" for the same door × SKU,
   **When** derived, **Then** the SKU is in with reason "added by door exception" and the
   overridden Retailer-level exception is reported as overridden.
4. **Given** a Retailer-level "Add" and a Door-level "Remove" for the same door × SKU,
   **When** derived, **Then** the SKU is out with reason "removed by door exception" and
   the overridden Retailer-level exception is reported.
5. **Given** a Retailer-level exception whose distributor name code differs from the
   door's only by case or surrounding whitespace, **When** derived, **Then** the exception
   does not apply to that door.
6. **Given** two active exceptions at the _same_ level with opposite actions for the same
   door × SKU, **When** derived, **Then** "Remove" wins: the SKU is out with reason
   "removed by door exception" (or "removed by retailer exception" if both are
   Retailer-level), and the losing "Add" exception is reported as overridden. If that
   level is itself overridden by a Door-level exception, the Door-level outcome applies.
7. **Given** a door with a missing tier and a Door-level or Retailer-level "Add"
   exception, **When** derived, **Then** the assortment stays empty, the SKU is out with
   reason "tier missing", and the explanation lists the exception as not applied because
   the tier is missing.
8. **Given** an "Add" exception for a SKU that is inactive or not in the loaded dataset,
   **When** derived, **Then** the SKU is not assorted and the reason is "SKU inactive" /
   "SKU not available" (exceptions never resurrect unavailable SKUs).

---

### User Story 3 - Efficient, lazy evaluation at portfolio scale (Priority: P2)

Screens need assortments for the selected door or the rows currently visible, plus
portfolio totals (e.g., SKU count per door, per tier, per product line) without ever
materializing every door × SKU combination.

**Why this priority**: Datasets can reach millions of door × SKU combinations; storing
them would exhaust browser memory and violate the "derived, never persisted" principle.
Correctness (P1) comes first, but the tool is unusable at real volumes without this.

**Independent Test**: Using synthetic datasets (small, medium, large), confirm that
results for a requested subset of doors equal those of a naive reference derivation, that
aggregate counts equal the sum of per-door results, and that per-door timing meets the
target.

**Acceptance Scenarios**:

1. **Given** a loaded dataset, **When** the engine prepares it, **Then** a lookup index is
   built once and reused for all subsequent door requests on that dataset.
2. **Given** many doors sharing the same tier and product line, **When** their
   assortments are requested, **Then** the base assortment for that (Tier, Product Line)
   pair is calculated once and reused, with only each door's exceptions applied on top.
3. **Given** a request for a specific set of doors (selected or visible), **When**
   derived, **Then** only those doors are calculated; no other door's assortment is
   produced.
4. **Given** a request for aggregate counts, **When** calculated, **Then** counts per
   (Tier, Product Line) pair and per door are returned without producing per-door SKU
   lists, and they equal the counts obtained from full per-door derivation.
5. **Given** a medium-volume dataset (see SC-002), **When** a single door's assortment is
   derived after the index is built, **Then** it completes within 200 ms.

---

### User Story 4 - Load only what the engine needs (Priority: P2)

Adapters load engine inputs from the existing data sources, fetching only the fields the
engine needs and only active/enabled records, across as many result pages as the data
source returns, and map them to the engine's plain input shapes.

**Why this priority**: The engine is pure and cannot load data itself; screens need a
reliable, efficient way to feed it. Load volume, not computation, is the main scalability
limit.

**Independent Test**: With the data-source services replaced by test doubles that return
multi-page results, confirm that adapters request only the needed fields with
active/enabled filters, follow every page to completion, map records correctly, and
report failures without returning partial data.

**Acceptance Scenarios**:

1. **Given** a data source that returns results across three pages, **When** an adapter
   loads, **Then** all records from all three pages are returned in the engine's input
   shape.
2. **Given** an adapter request, **When** it is issued, **Then** it asks only for the
   fields the engine uses and filters to active/enabled records at the source.
3. **Given** a page request fails midway, **When** loading, **Then** the adapter reports
   the failure and no partial dataset is handed to the engine.
4. **Given** a source record missing an optional field (e.g., no product line, no tier,
   no distributor name code), **When** mapped, **Then** the engine input represents the
   value as absent rather than as an empty or placeholder string.

---

### User Story 5 - Enforce a 100% unit-test coverage gate (Priority: P3)

The project's automated unit-test run fails if line, branch, function, or statement
coverage falls below 100%, excluding generated code, the app entry point, type-only files,
and test files.

**Why this priority**: Required by the constitution (Principle XIV) before any spec can be
declared complete; it protects the engine's correctness guarantees over time.

**Independent Test**: Run the coverage-enabled unit-test command and confirm it reports
100% for all four metrics and fails when an uncovered branch is deliberately introduced.

**Acceptance Scenarios**:

1. **Given** the full unit-test suite, **When** run with coverage, **Then** lines,
   branches, functions, and statements are all at 100% for every in-scope file.
2. **Given** a newly added uncovered branch in an in-scope file, **When** the coverage run
   executes, **Then** it fails.
3. **Given** files under the generated-code folder, the app entry point, type-only files,
   or test files, **When** coverage is calculated, **Then** they are excluded.

---

### Edge Cases

- Door has no tier, or references a tier not present/active in the dataset → "tier
  missing".
- Door has no product line (absent or empty) → no SKU matches by axis; every tier-rule SKU
  reports "axis mismatch". An absent/empty product line never matches an absent/empty
  Axis.
- SKU has no Axis → never matches any product line ("axis mismatch").
- Near-miss product lines: differing case, leading/trailing whitespace, internal double
  spaces, look-alike characters → no match.
- The same SKU appears in more than one rule for the same tier → counted once.
- A tier has no enabled rules → empty base assortment, reason "not in tier rules" for all
  SKUs.
- Exceptions with status other than Active (e.g., Cancelled) or inactive state → ignored.
- Malformed exceptions (missing level, missing action, Door-level without a door,
  Retailer-level without a distributor name code, missing SKU) → ignored and counted in a
  dataset diagnostics summary rather than failing the derivation.
- Duplicate identical exceptions (same level, action, door/retailer, SKU) → treated as
  one.
- Door has no distributor name code → no Retailer-level exception applies to it.
- Same-level Add vs Remove conflict → "Remove" wins (User Story 2, scenario 6).
- Any exception on a door with a missing tier → not applied; assortment is empty
  (User Story 2, scenario 7).
- Empty dataset (no doors / no SKUs) → derivations and counts return empty results, not
  errors.
- Requesting a door identifier that is not in the dataset → a clear "door not found"
  result, not an exception that crashes the caller.

## Requirements _(mandatory)_

### Functional Requirements

**Derivation rules**

- **FR-001**: The engine MUST resolve each door's tier from the door's tier reference; if
  the reference is absent or does not resolve to a tier in the dataset, the door's base
  assortment MUST be empty with reason "tier missing".
- **FR-002**: The engine MUST collect the SKUs referenced by the resolved tier's rules,
  considering only rules that are enabled and active and only SKUs that are active.
- **FR-003**: The engine MUST keep a tier-rule SKU in the base assortment only when the
  SKU's Axis text is exactly equal to the door's Product Line text — case-sensitive, with
  no trimming, normalization, splitting, or mapping table.
- **FR-004**: The engine MUST apply active Assortment exceptions on top of the base
  assortment: "Add" includes the SKU, "Remove" excludes it.
- **FR-005**: A Door-level exception MUST apply only to the door it references; a
  Retailer-level exception MUST apply to every door whose distributor name code is exactly
  equal (case-sensitive, no trimming) to the exception's distributor name code.
- **FR-006**: When a Door-level and a Retailer-level exception both address the same door
  × SKU, the Door-level exception MUST win.
- **FR-007**: When two active exceptions at the same level and for the same door × SKU
  have opposite actions, "Remove" MUST win, and the explanation MUST report the losing
  "Add" exception as overridden.
- **FR-008**: Exceptions MUST never assort a SKU that is inactive or absent from the
  dataset.
- **FR-009**: For a door with a missing tier, the assortment MUST be empty: no exception
  (Door- or Retailer-level) is applied, every SKU reports "tier missing", and explanations
  list any matching exceptions as not applied.
- **FR-010**: Inactive, cancelled, or malformed exceptions MUST be ignored and reported in
  a dataset diagnostics summary (counts by cause).

**Results and explanations**

- **FR-011**: A door's derived assortment MUST be expressed as SKU identifiers with a
  reason code for each, never as copies of SKU records.
- **FR-012**: The engine MUST be able to explain, for any door × SKU pair, whether the SKU
  is in or out and why, using a fixed set of reason codes covering at least: in tier
  rules; added by door exception; added by retailer exception; tier missing; not in tier
  rules; rule disabled; SKU inactive; SKU not available; axis mismatch; removed by door
  exception; removed by retailer exception.
- **FR-013**: When an exception changes the base outcome, the explanation MUST include
  both the final reason and the underlying base reason; when a lower-precedence exception
  is overridden, the explanation MUST identify it as overridden.
- **FR-014**: Explanations MUST be produced on demand from the indexed inputs and MUST NOT
  require stored per-door × SKU reasons.
- **FR-015**: All engine functions MUST be deterministic: the same inputs MUST always
  produce the same outputs, in a stable SKU order.

**Storage, evaluation, and scale**

- **FR-016**: Door assortments MUST be derived and never persisted: no new data-source
  table, no browser storage, and no in-memory structure holding a materialized
  door × SKU result for the whole portfolio.
- **FR-017**: The engine MUST build its lookup index once per loaded dataset and reuse it
  for every subsequent request on that dataset.
- **FR-018**: The engine MUST calculate the base assortment once per distinct
  (Tier, Product Line) pair and reuse it for every door sharing that pair.
- **FR-019**: The engine MUST calculate assortments lazily, only for the doors explicitly
  requested (e.g., the selected door or the visible rows).
- **FR-020**: The engine MUST provide aggregate counts per (Tier, Product Line) pair and
  per door, derived from base counts adjusted by effective exceptions, without producing
  per-door SKU lists.
- **FR-021**: The engine MUST contain no UI, no data-source access, and no side effects;
  all inputs MUST be plain typed objects supplied by callers.

**Data loading (adapters)**

- **FR-022**: Adapters MUST load Doors, Tiers, Tier rules, SKUs, and Assortment exceptions
  exclusively through the project's existing generated data-source services.
- **FR-023**: Adapters MUST request only the fields the engine needs and MUST filter at
  the source to active records (and, for tier rules, enabled; for exceptions, Active
  status).
- **FR-024**: Adapters MUST follow every result page until the source reports no more
  pages, and MUST fail as a whole (no partial dataset) if any page fails.
- **FR-025**: Adapters MUST map source records into the engine's plain input shapes,
  representing missing optional values as absent.

**Quality gate**

- **FR-026**: The unit-test run MUST enforce 100% line, branch, function, and statement
  coverage thresholds, excluding only generated code, the app entry point, type-only
  files, and test files. Thresholds apply project-wide. To make the gate pass, existing
  template sample files that nothing in the app needs (e.g., sample-items hook and
  placeholder sample service, and anything only they use) MUST be removed, and the
  remaining non-excluded files (e.g., app shell, Power provider, Power context helper,
  Home page) MUST receive tests bringing them to 100%.
- **FR-027**: Unit tests MUST cover every rule, precedence decision, and edge case listed
  in this spec, including missing tier, inactive SKUs, disabled tier rules, near-miss
  product lines, and conflicting exceptions.
- **FR-028**: Tests MUST include equivalence checks proving the optimized derivation
  agrees with a straightforward reference derivation on generated datasets.

### Key Entities _(include if feature involves data)_

- **Door**: A point of sale. Engine-relevant attributes: identifier, tier reference,
  Product Line (single text value), distributor name code (identifies the retailer).
- **Tier**: An assortment level. Engine-relevant attributes: identifier, active state.
- **Tier rule**: Links a tier to a SKU. Attributes: identifier, tier reference, SKU
  reference, enabled flag, active state.
- **SKU**: A sellable product. Attributes: identifier, Axis (text compared to Product
  Line), active state.
- **Assortment exception**: A sparse adjustment. Attributes: identifier, level (Door or
  Retailer), action (Add or Remove), status (Active or Cancelled), active state, SKU
  reference, door reference (Door-level), distributor name code (Retailer-level), date
  reported.
- **Engine dataset index** (derived, in memory, per load): lookup structures over the
  above inputs plus cached base assortments per (Tier, Product Line) pair.
- **Door assortment result** (derived, transient): door identifier, list of SKU
  identifiers with reason codes, and a door count.
- **Explanation** (derived, transient): door × SKU in/out outcome, final reason, base
  reason, and any applied or overridden exceptions.
- **Aggregate counts** (derived, transient): SKU counts per (Tier, Product Line) pair and
  per door.
- **Dataset diagnostics** (derived, transient): counts of ignored/malformed records by
  cause.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of the acceptance scenarios in this spec are covered by automated
  tests, and all pass.
- **SC-002**: On a medium-volume dataset (3,000 doors, 5,000 SKUs, 6 tiers, 12 product
  lines, 18,000 tier rules, 20,000 exceptions), a single door's assortment is produced in
  ≤ 200 ms after the dataset has been prepared.
- **SC-003**: On the same dataset, preparing the dataset index takes ≤ 1 second, and
  portfolio-wide counts for all doors are produced in ≤ 100 ms.
- **SC-004**: Engine working memory on the same dataset stays proportional to
  (Tier, Product Line) pairs × SKUs plus exceptions — under 5 MB beyond the loaded
  inputs — rather than to doors × SKUs.
- **SC-005**: For 100% of generated test datasets, the optimized engine's results and
  counts equal those of the reference derivation.
- **SC-006**: Every SKU in or out of any door can be explained with a single reason code
  from the defined set (plus base/overridden details where applicable); no SKU outcome is
  left without a reason.
- **SC-007**: Unit-test coverage is 100% for lines, branches, functions, and statements
  across all in-scope files, and the run fails automatically if it drops.
- **SC-008**: Loading the medium-volume dataset completes with no more than about a dozen
  data-source requests (only required fields, active/enabled records only).

## Assumptions

- The engine lives in `src/features/engine/` and is consumed by later feature specs;
  this spec delivers no screens and no Playwright/visual tests.
- Coverage is enforced through the project's existing unit-test runner (Vitest) with a
  coverage provider added as a dev dependency if not already present.
- A Door has a single Product Line value (the Door record exposes one Product Line field);
  it is compared as a whole, never split into multiple values.
- "Retailer" is identified by the Door's distributor name code, matched to the
  exception's distributor name code (resolves TODO(RETAILER_FIELD) for this feature).
- "Active" means: Tier, Door, SKU, Tier rule, and exception records are in the active
  state; additionally SKUs must not be flagged inactive, tier rules must be enabled, and
  exceptions must have status Active.
- Tier-rule effective dates are not considered in this spec; an enabled, active rule is
  in effect regardless of its effective date.
- The SKU record's own tier reference is ignored; tier rules are the sole source of a
  tier's SKUs.
- Inactive doors are not loaded and are therefore not derived; a request for one returns
  "door not found".
- Because adapters filter inactive/disabled records at the source, the reasons "SKU
  inactive" and "rule disabled" appear only when such records are supplied directly
  (e.g., tests or future loaders); in production loads, those SKUs report "SKU not
  available" or "not in tier rules".
- Data volumes fit in browser memory for the "medium" band (≤ ~200k input rows); larger
  bands (background processing, progressive loading) are out of scope.
- Results are recalculated from a fresh load; incremental/partial recalculation after
  edits is out of scope.
- Which template files count as "unused sample files" (FR-026) is confirmed during
  planning by checking imports; anything still referenced by the app is kept and tested.

## Clarifications

### Session 2026-10-26

- Q: Same-level Add vs Remove conflict for the same door × SKU? → A: Remove wins.
- Q: Do exceptions apply to a door whose tier is missing? → A: No; the assortment stays
  empty and all SKUs report "tier missing".
- Q: How to satisfy project-wide 100% coverage given untested template files? → A: Remove
  truly unused sample files; add tests for the rest.

## Data Gaps

| Needed by this feature                                                                            | Available in generated services                                                     | Handling                                                                                                                    |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Retailer entity for Retailer-level exceptions                                                     | No Retailer table; Door and exception both carry a distributor name code text field | Match on exact distributor name code text (Assumptions). No table is created.                                               |
| Multi-valued Product Line per door (constitution wording "one of the Door's Product Line values") | Door has a single Product Line text field                                           | Treated as single-valued; if multi-valued product lines are introduced later, the engine's matching rule must be revisited. |

No other gaps: Door, Tier, Tier rule, SKU, and Assortment exception are all generated and
expose every field the engine needs.

## Verification & Known Limitations

**Results (2026-10-26, implemented per `tasks.md`)**

- `npm run test:coverage`: 17 test files, 100 tests passing; statements 100% (279/279),
  branches 100% (151/151), functions 100% (71/71), lines 100% (240/240). A deliberately
  uncovered branch made the run fail, confirming the gate (SC-007).
- `npm run lint`, `npm run build`, and `prettier --check .` are clean. A temporary
  `react` / adapters import in `core/` was rejected by the purity lint rule.
- Optimized engine equals the naive reference engine on 500 generated datasets, covering
  results, explanations, and counts (SC-005).
- Medium dataset (3,000 doors, 5,000 SKUs, 6 tiers, 12 product lines, 18,000 rules,
  20,000 exceptions), measured in `engine.perf.test.ts` on the dev machine: index build
  ≈ 22 ms (SC-003 ≤ 1 s); single door ≈ 1.2 ms cold and ≈ 0.2 ms warm (SC-002 ≤ 200 ms);
  counts for all doors ≈ 11 ms (SC-003 ≤ 100 ms). Loading the same volume issues 11
  data-source requests (SC-008); both measured with mocked services, not a live
  environment.

**Known limitations and deviations**

- No UI; explanations are available only through engine functions until screen specs are
  delivered.
- Tier-rule effective dates are ignored.
- Volumes beyond the "medium" band are not supported.
- Adapters are verified against mocked generated services only; no live Dataverse run, so
  the OData `select`/`filter` strings (including `_cr380_*_value` lookup columns) are
  unconfirmed against a real environment.
- Exception cancellation is expressed through the `active` flag; adapters filter to
  status Active at the source, so "cancelled" exceptions never reach the engine and
  appear in diagnostics only as `inactive` when supplied directly.
- `PairCount.doorCount` is the number of doors sharing the (Tier, Product Line) pair;
  doors with a missing tier are excluded from `byPair` but appear in `byDoor` with 0.
- Vitest 5 no longer exports `bench`, so performance is asserted with timed tests rather
  than `vitest bench`.
- Template cleanup: the starter demo page, sample hook, and placeholder service were
  removed; `App.tsx` now shows only the placeholder banner until the first screen spec.
- Engine core lint purity rule replaces (not extends) the global `no-restricted-imports`
  list for `src/features/engine/core/**`; that folder has no network code by design.
