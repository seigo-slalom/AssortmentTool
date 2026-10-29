# Feature Specification: Tier Assortments Screen

**Feature Branch**: `004-tier-assortment-screen`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "Build out the Tier Assortment page exactly like the prototype. Please limit the amount of unit testing as this is also a prototype app."

## Overview

This feature replaces the Tier assortments placeholder with the prototype's Tier
assortments screen: pick one cluster tier at a time, then tick the SKUs it carries,
organised by product group. Changes are staged, reviewed, and saved together; every
eligible door in the tier then receives the result (via the Assortment Engine). Tier
structure (add, edit, retire tiers) is managed from the same screen.

**In scope**:

- Page header (eyebrow "Strategy", title "Tier assortments", description, Export action).
- Tier rail listing active tiers with rank, door count, SKU count, and unsaved-change marker;
  "Manage tiers" entry.
- Selected-tier panel: name, summary line, "Edit tier" action, search, Axis filter, SKU type
  filter, "All / In tier / Not in tier" switch, "Needs attention" chip, focus tag,
  Expand/Collapse all, product-group list with group checkboxes, coverage bar, flags, and
  expandable SKU rows, footnote.
- Staging bar (Discard, Review and save) and Save dialog with a required reason.
- Manage tiers drawer and Add / Edit / Retire tier dialogs with "What happens" impact text.
- SKU detail drawer (attributes, where it is distributed, exceptions).
- Narrow-layout behaviour (rail stacks above the panel below 1100 px wide).

**Out of scope**: Doors, Bulk Update, and Exceptions content (linked to only), and prototype
features depending on excluded screens or demo controls.

**Prototype items intentionally not carried over**:

| Prototype item                                                               | Reason                                                                 |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Role locks ("View only…", retail/SPM ownership, "Brand Management manages…") | No role data exists; every user may change every SKU and manage tiers. |
| "Last changes" timeline in the SKU drawer                                    | Change log / Activity is excluded; no history data source.             |
| "…next SAP inclusion/exclusion export" wording in the Save dialog            | Exports is excluded; wording refers to door assortments only.          |
| "History stays in Activity" wording in the Retire dialog                     | Activity is excluded.                                                  |

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Review a tier's assortment (Priority: P1)

An assortment planner opens Tier assortments, picks a tier in the rail, and sees which SKUs
it carries, grouped by product group (franchise within axis), with coverage per group.

**Why this priority**: Viewing the tier assortment is the core of the screen and the basis of
every other story.

**Independent Test**: Open the screen with real data, select each tier, and confirm group
coverage and SKU membership match the stored tier rules.

**Acceptance Scenarios**:

1. **Given** active tiers exist, **When** the screen opens, **Then** the rail lists them in
   rank order with a two-digit rank, "N doors · N SKUs", and the first tier is selected.
2. **Given** a tier is selected, **When** the panel renders, **Then** it shows the tier name,
   "description · N doors · N retail and N SPM SKUs", and product groups sorted by axis then
   name, each with "Axis · N SKUs (N retail, N SPM)", coverage "X of Y" with a bar, and a
   "Show N" control.
3. **Given** a group is expanded, **When** its rows show, **Then** each SKU row shows
   "key · name", "SKU type · line · category", "Also in <other tiers>" (or "Only here"), flags,
   and is sorted by SKU type then name.
4. **Given** search text, an axis, or a SKU type is chosen, **When** the list updates,
   **Then** only matching SKUs/groups show, matching groups open automatically, and the
   "All / In tier / Not in tier" counts reflect the filtered set.
5. **Given** the filters match nothing, **When** the list renders, **Then** a context message
   shows (for example "Every SKU that matches these filters is already in <Tier>.").

---

### User Story 2 - Stage and save SKU changes (Priority: P1)

The planner ticks or unticks SKUs (individually or a whole group), reviews the staged
changes with their door impact, gives a reason, and saves.

**Why this priority**: Changing what a tier carries is the screen's primary purpose.

**Independent Test**: Stage adds and removes across two tiers, save with a reason, and
confirm the tier rules and door counts update; discard restores the saved state.

**Acceptance Scenarios**:

1. **Given** a SKU row, **When** the user toggles its checkbox, **Then** the change is staged
   (not saved), the row shows "Adding" or "Removing", the group shows "N unsaved changes" with
   a tinted background, and the rail marks the tier "● N unsaved changes".
2. **Given** a group checkbox, **When** toggled, **Then** every SKU in the group is staged to
   join (if any is missing) or leave the tier, and a message confirms the count; toggling a
   SKU back to its saved state removes it from staging.
3. **Given** staged changes, **When** shown, **Then** a sticky bar reads "N unsaved changes
   across N tiers · ±N door assortments when saved" with Discard and Review and save.
4. **Given** the user opens Review and save, **When** the dialog shows, **Then** it lists
   each change (SKU, tier, Add/Remove, eligible doors) and "Save changes" is disabled until a
   reason (max 280 characters) is entered.
5. **Given** a reason is entered, **When** the user saves, **Then** all staged changes are
   persisted, staging clears, and a confirmation states the number of changes and door
   assortment delta; any failure is reported and unsaved changes remain staged.
6. **Given** staged changes, **When** the user clicks Discard, **Then** all staged changes
   are cleared.

---

### User Story 3 - Find new SKUs that are in no tier (Priority: P2)

The planner uses "Needs attention" to find new SKUs from Sunrise that are in no tier and
assigns them.

**Why this priority**: Prevents new SKUs from silently reaching no door.

**Independent Test**: With at least one SKU that has no tier rule and no add exception, the
chip appears, filters to those SKUs, and clears.

**Acceptance Scenarios**:

1. **Given** SKUs in no tier exist, **When** the screen renders, **Then** a "Needs attention"
   chip shows "N new SKUs from Sunrise in no tier yet".
2. **Given** the chip is pressed, **When** active, **Then** only those SKUs show (groups
   open), the switch resets to All, a closable "Showing: New SKUs in no tier yet" tag shows,
   and rows/groups show the "New · in no tier" / "N new" flag.
3. **Given** the focus tag is closed or the chip is pressed again, **Then** the focus clears.

---

### User Story 4 - Inspect a SKU (Priority: P2)

The planner clicks a SKU name to open a detail drawer.

**Independent Test**: Open a SKU and confirm attributes, per-tier reach, and exceptions.

**Acceptance Scenarios**:

1. **Given** a SKU row, **When** its name is clicked, **Then** a drawer titled with the SKU
   name shows: SKU key, name, barcode, master product name and baseline, axis (with which
   doors receive it), master franchise, franchise, line, master category, category,
   subcategory, SKU type, tier rules (or "Not yet assorted"), and last seen in Sunrise.
2. **Given** the drawer is open, **Then** "Where it's distributed" lists each active tier
   with Brick & Mortar and E-business door counts that receive the SKU, and "Exceptions"
   lists door/retailer exceptions (target, Added/Removed, reason) or "No exceptions for this
   SKU."

---

### User Story 5 - Manage tiers (Priority: P3)

The planner opens Manage tiers to add, edit (rename, describe, re-rank), or retire a tier.

**Independent Test**: Add a tier copied from another, edit its name and position, then retire
it moving its doors; confirm the rail, counts, and doors reflect each step.

**Acceptance Scenarios**:

1. **Given** Manage tiers is opened, **Then** a drawer shows explanatory text and a grid
   (Rank, Tier, Doors, SKUs, Edit / Retire) with Close and "Add a tier".
2. **Given** Add a tier, **When** the dialog shows, **Then** it asks for name (required, ≤30
   characters, unique, case-insensitive), description, position ("First (entry level)" or
   "After <tier>"), start (copy SKUs from a tier, or empty), a "What happens" box, and a
   required reason; on save the new tier is selected and a confirmation is shown.
3. **Given** Edit tier (from the rail panel or the grid), **When** saved with a changed name,
   description, or position and a reason, **Then** the label and order update everywhere.
4. **Given** Retire tier on a tier with doors, **When** the dialog shows, **Then** a "Move
   its doors to" choice is required, the impact text estimates SKUs gained/lost per door,
   and "Retire tier" (danger) is enabled only with a destination and reason; on save the
   doors move, the tier's rules are removed, the tier leaves all lists, and its staged
   changes are dropped.
5. **Given** only one active tier remains, **Then** Retire is not offered.

---

### User Story 6 - Export tier assortments (Priority: P3)

**Acceptance Scenarios**:

1. **Given** the screen, **When** the user clicks Export (download icon), **Then** an Excel
   workbook downloads with columns SKU key, SKU name, Franchise, Line, Axis, SKU type, then
   one column per active tier containing "Yes" when the SKU is saved in that tier, and a
   confirmation states "N SKUs × N tiers".

### Edge Cases

- No active tiers: rail is empty and the panel shows an empty state inviting "Add a tier".
- Selected tier is retired or no longer active: selection falls back to the first tier.
- Switching tiers clears expanded groups and the focus; staged changes for other tiers remain.
- A group whose SKUs are all already in their target state shows its checkbox disabled.
- Saving when another user changed the same rule: the save re-reads the rule and skips
  no-op changes rather than duplicating rules.
- Loading and load errors show the shared loading/error region states with retry.
- Very large catalogues: groups stay collapsed by default; the list scrolls inside the panel
  with a sticky header.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The screen MUST match the prototype's layout, copy, ordering, and visual
  treatment for every in-scope element, using the app's shared components and design tokens.
- **FR-002**: The rail MUST list active tiers by rank with two-digit rank, door and SKU
  counts, current-selection styling, and an unsaved-change marker.
- **FR-003**: Product groups MUST be formed by axis + franchise, sorted by axis then name,
  and show SKU count with retail/SPM split, coverage "X of Y" with a proportional bar, and
  flags ("N unsaved changes", "N new").
- **FR-004**: Search MUST match SKU key, SKU name, or franchise (case-insensitive); Axis is
  single-select ("All axes" default); SKU type is multi-select Retail/SPM (none = both).
- **FR-005**: The All / In tier / Not in tier switch MUST show counts for the filtered set
  and evaluate membership using staged values.
- **FR-006**: Groups MUST be collapsed by default and open automatically while a search or
  focus is active; Expand all / Collapse all MUST toggle every visible group.
- **FR-007**: SKU and group checkbox changes MUST be staged locally per (SKU, tier) and MUST
  NOT persist until saved; reverting to the saved value MUST un-stage.
- **FR-008**: Door impact for a staged change MUST equal the number of active, tiered doors
  in that tier eligible for the SKU (SKU axis matches door product line; Multi-axis reaches
  every door), positive for adds and negative for removes.
- **FR-009**: Saving MUST require a reason (1–280 characters), persist all staged changes as
  tier rules (add = enabled rule exists; remove = rule disabled), and refresh counts and door
  assortments everywhere without reload.
- **FR-010**: "Needs attention" MUST count SKUs with no enabled tier rule and no active
  add exception.
- **FR-011**: The SKU drawer MUST show the attributes, reach grid, and exceptions grid in
  User Story 4.
- **FR-012**: Manage tiers MUST support add (with optional copy of another tier's SKUs),
  edit (name, description, position), and retire (with required door destination when the
  tier has doors), each with validation, "What happens" impact text, and a required reason.
- **FR-013**: Tier position changes MUST re-rank active tiers so order is consistent across
  the app.
- **FR-014**: Export MUST produce an Excel workbook as in User Story 6, using the same
  export approach and download icon as the Doors screen.
- **FR-015**: All confirmations MUST use the app's toast/message pattern with the prototype's
  wording (minus excluded-screen references).
- **FR-016**: The screen MUST be keyboard operable and meet WCAG 2.1 AA (labelled
  checkboxes, `aria-current` on the selected tier, `aria-pressed` on the chip, `aria-expanded`
  on group toggles).
- **FR-017**: Below 1100 px wide the rail MUST stack above the tier panel.
- **FR-018**: Reasons entered in Save and tier dialogs are kept for the session only (no
  change log), consistent with the Doors screen.

### Key Entities

- **Tier**: name, description, rank, status (active/retired).
- **Tier rule**: links one SKU to one tier; enabled or disabled.
- **SKU**: key, name, barcode, master product name/baseline, axis, master franchise,
  franchise, line, master/product category, subcategory, SKU type (Retail/SPM), last seen in
  Sunrise.
- **Door**: tier, product line, channel, status — used for counts, impact, and retire moves.
- **Assortment exception**: used for "Needs attention" and the SKU drawer.
- **Staged change**: transient (SKU, tier, add/remove); not persisted until saved.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A planner can add a full product group to a tier and save it in under 30 seconds.
- **SC-002**: Switching tiers or applying any filter updates the list in under 1 second for
  the full SKU catalogue.
- **SC-003**: After saving, 100% of staged changes are reflected in tier counts and door
  assortments without reloading.
- **SC-004**: In side-by-side review, reviewers confirm the screen looks and behaves like
  the prototype at compact, standard, and wide sizes.
- **SC-005**: Automated accessibility checks report zero WCAG 2.1 AA violations on the
  screen, the Save dialog, Manage tiers, tier dialogs, and the SKU drawer.
- **SC-006**: Exported workbooks match saved tier rules for 100% of SKUs and tiers.

## Assumptions

- Prototype app: testing is deliberately light — a small number of unit tests for pure
  logic (staging, impact, grouping) plus one smoke end-to-end/accessibility check; no
  exhaustive component tests.
- No user roles exist; all users can change all SKUs and manage tiers (role locks dropped).
- Removing a SKU from a tier disables its tier rule; re-adding re-enables an existing rule
  or creates one.
- Retiring a tier sets its status to retired/inactive and disables its rules; the record is
  kept.
- "Retail" and "SPM" map to the SKU type field; product groups use the SKU franchise.
- Only active SKUs are listed; tier/SKU counts use enabled rules and active records.
- Door counts per tier use active, tiered doors (same definition as Doors screen).
- Export uses the same Excel library and download-icon button as the Doors screen.

## Data Gaps

| Needed by this feature              | Available in generated services | Handling                                   |
| ----------------------------------- | ------------------------------- | ------------------------------------------ |
| SKU change history ("Last changes") | Change log excluded             | Section removed from the SKU drawer.       |
| Change reasons                      | No reason field on rules/tiers  | Required in UI, kept for the session only. |
| User roles / SKU ownership          | None                            | All actions available to all users.        |

## Verification & Known Limitations

### Test results (2026-10-28, Windows, Vitest + Playwright Chromium)

- Unit: 85 files / 453 tests pass; global 100% coverage thresholds met. New pure logic
  (`src/lib/tiers/**`) and new mutations (`enableTierRule`, `disableTierRule`, `createTier`,
  `updateTier`) are at 100%.
- E2E: `e2e/tier-assortments` (view, switch tier, stage a group, save with reason, axe on
  screen and Save dialog) passes; shell responsive matrix (7 viewports + 320 px), axe at
  390/1366 px, and navigation tests pass for `#/tier-assortments`.
- `npm run build` and `npm run lint` are clean.

### Untested or manually verified only

- Per user request (prototype app), UI components under `src/features/tier-assortments/**`
  and the page have no unit tests and are excluded from coverage thresholds.
- No E2E for: Needs attention chip, SKU drawer, Manage tiers add/edit/retire, Export,
  narrow-layout (< 1100 px) stacking. No new screenshot baselines were captured.
- E2E fixture has no SKU outside every tier, so the "Needs attention" chip is not exercised.

### Known limitations and deviations

- Door eligibility follows the Assortment Engine (SKU axis must equal door product line).
  The prototype's "Multi-axis SKUs reach every door" rule is not applied (spec FR-008).
- Role locks, "Last changes" history, and SAP/Activity wording are omitted (see Overview).
- Reasons for rule and tier changes are required but not persisted (FR-018).
- The selected tier is marked with `aria-current="true"` (not `"page"`) because the main
  navigation already marks the current page.
- Retiring a tier moves every door assigned to it (including closed doors), disables its
  rules, and sets its status to Inactive; ranks of remaining tiers are not compacted.
