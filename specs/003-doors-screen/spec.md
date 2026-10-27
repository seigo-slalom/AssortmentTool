# Feature Specification: Doors Screen & Bulk Update

**Feature Branch**: `003-doors-screen`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Generate content for the Doors Screen. Make the screen functionally and visually similar to the prototype. Make sure to use Ant Design components for all UI components when possible. Export should use exceljs to export the current grid and the button should have a download icon. For Saved Filters, hardcode the ones in the prototype: Needs tier, Fragrance-only product line, opened in last 90 days, closed, Q3 cluster review. If any of the filters are not supported by the current data limitations, do not included it. Mass update should be changed to "Bulk Update" with an update icon. Bulk Updates must follow the same UX experience as the prototype, walking and instructing users through four steps. Continue to use Deep links within the app such as when you click Bulk Update, it shows a breadcrumb of what subpage it's apart of. Anything else not mentioned in this spec should be assumed as included into the page if it's in the prototype"

## Overview

This feature replaces the Doors placeholder with the prototype's Doors screen, backed by
real door, tier, SKU, and exception data and by the Assortment Engine, and replaces the
"Mass update" placeholder sub-screen with **Bulk Update**: the prototype's four-step
guided workflow for re-tiering many doors or adding/removing SKUs at many doors at once.

**In scope**:

- Doors screen: page header (eyebrow "Strategy", title "Doors", live description, actions
  Export and Bulk Update), search, primary filters, "More filters", saved filters, "Clear
  filters", door grid with selection, sorting, paging, inline tier change with a
  confirmation dialog, selection bar, and loading/error/empty region states.
- Bulk Update sub-screen (renamed from Mass update) reached from Doors with a breadcrumb
  back to Doors, including the "How bulk update works" intro, the four-step indicator, the
  four steps, and the result screen with undo.
- Deep links: Doors, Bulk Update, and Door detail each have their own address; sub-screens
  show the breadcrumb of the screen they belong to.

**Out of scope**: Door detail content (separate spec; this feature only navigates to it),
Tier assortments and Exceptions screen content (this feature only links to them), and
prototype features that depend on constitution-excluded screens (Activity, Exports) or on
prototype demo controls ("Viewing as" persona switcher, density toggle, sample files).

**Prototype items intentionally not carried over**:

| Prototype item                                                                       | Reason                                                                                   |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| "Q3 cluster review" saved filter (Doors and Bulk Update)                             | No door field identifies cluster-review membership (data limitation).                    |
| "Not tiered (internal)" tier option and the "internal territory" skip rule           | No door field identifies internal territories (data limitation).                         |
| "See it in Activity" and "Go to Exports" result actions; Activity/SAP-export wording | Activity and Exports are excluded screens.                                               |
| "Use the sample file" button in Bulk Update                                          | Prototype demo data; real data only (constitution IX).                                   |
| Role-based locks ("Not available for your role", view-only tag)                      | Persona switcher is a demo control; no role data exists. All users may use every action. |

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Find and review doors (Priority: P1)

A commercial-development analyst opens Doors and sees every open door with its name, Door
key, tier, number of SKUs assorted, distributor, product line, door type, online/offline,
sales channel, exception count, door status, SAP Ship To, and when it last changed. They
narrow the list with search, the Distributor name and Tier filters, the additional filters
behind "More filters", or one of the saved filters, and open a door to see its detail.

**Why this priority**: Finding doors and seeing their tier and assortment size is the
screen's core purpose and the starting point for every other action on it.

**Independent Test**: Load a known fixture of doors, tiers, SKUs, rules, and exceptions;
apply each filter and saved filter and confirm the grid rows, counts, and header
description match the expected subset.

**Acceptance Scenarios**:

1. **Given** doors are loaded, **When** the analyst opens Doors, **Then** the header shows
   eyebrow "Strategy", title "Doors", the description "N doors match the current filters.
   M doors need a tier." (or "Every door has a tier." when M = 0), and the grid lists all
   doors except Closed and Cancelled doors, sorted by door name.
2. **Given** the grid is shown, **When** the analyst types in "Search door name, Door key
   or SAP Ship To", **Then** only doors whose name, Door key, or SAP Ship To contains the
   text (case-insensitive) remain, and the description count updates.
3. **Given** the grid is shown, **When** the analyst selects one or more values in
   Distributor name and/or Tier (Tier options: every active tier plus "Needs tier"),
   **Then** only doors matching all chosen filters remain.
4. **Given** the grid is shown, **When** the analyst clicks "More filters", **Then**
   Online / offline, Door type, Product line, and Door status filters appear and the button
   reads "Fewer filters"; when any of these is set the button shows the count, e.g. "Fewer
   filters (2)"; clicking "Fewer filters" hides them and clears their values.
5. **Given** any filter, search, or saved filter is active, **When** the analyst clicks
   "Clear filters", **Then** all are reset and "Clear filters" disappears.
6. **Given** the "Saved filters" row shows Needs tier, Fragrance-only product line, Opened
   in last 90 days, and Closed, **When** the analyst checks one, **Then** it becomes the
   only checked saved filter and the grid shows: doors with no tier (Needs tier); doors
   whose product line is "Fragrance" (Fragrance-only product line); doors whose original
   opening date is within the last 90 days up to today (Opened in last 90 days); or only
   Closed and Cancelled doors (Closed). Unchecking it removes the saved filter.
7. **Given** a door has a tier and is not Closed/Cancelled, **When** it is shown, **Then**
   "SKUs assorted" shows the engine's derived SKU count; doors with no tier show "Needs
   tier" with a warning indicator in the Tier column and an empty SKU count.
8. **Given** more than 50 doors match, **When** the grid is shown, **Then** it pages 50
   rows at a time with a "1–50 of N" total, and Door name and Door key stay pinned while
   scrolling horizontally.
9. **Given** the grid is shown, **When** the analyst activates a row (click or Enter),
   **Then** the app navigates to that door's Door detail address, with the breadcrumb
   "Doors" leading back to the Doors screen with the previous filters intact.

---

### User Story 2 - Export the current grid (Priority: P1)

The analyst exports the doors currently shown (all pages of the filtered list) or only the
selected doors to an Excel workbook to share or analyze offline.

**Why this priority**: Export is the primary hand-off to other teams and is a header
action on the screen.

**Independent Test**: Apply a filter, click Export, open the downloaded workbook, and
verify the rows and columns equal the filtered grid.

**Acceptance Scenarios**:

1. **Given** filters are applied, **When** the analyst clicks "Export" (download icon),
   **Then** an Excel workbook (.xlsx) downloads containing one header row and one row per
   door in the current filtered list across all pages, in the grid's current sort order,
   with the columns listed in FR-021, and a confirmation message "Door list exported · N
   doors" appears.
2. **Given** doors are selected, **When** the analyst clicks "Export selection" in the
   selection bar, **Then** a workbook containing only the selected doors downloads.
3. **Given** no doors match the filters, **When** the analyst clicks Export, **Then** a
   workbook with only the header row downloads and the message reads "· 0 doors".

---

### User Story 3 - Change one door's tier inline (Priority: P2)

From the grid, the analyst picks a new tier in a door's Tier cell, sees the impact on that
door's assortment before saving, gives a reason, and confirms.

**Why this priority**: Single-door tier assignment resolves "Needs tier" doors, the most
common data issue surfaced by Overview.

**Independent Test**: Choose a new tier for a fixture door; verify the dialog's impact
text equals the engine's counts and that, after confirming, the door's tier and SKU count
update.

**Acceptance Scenarios**:

1. **Given** an open door, **When** the analyst picks a tier in its Tier cell, **Then** a
   confirmation dialog asks "Change tier for {door} from {current tier or "no tier"} to
   {new tier}?" and states how many SKUs the door will receive in total and, if it already
   had a tier, the difference against today (e.g. "+12 against today").
2. **Given** the door's product line limits which SKUs it receives, **When** the dialog
   opens, **Then** the impact notes that SKUs of other axes are skipped.
3. **Given** the dialog is open, **When** no new tier is chosen, the chosen tier equals
   the current one, or the reason is empty, **Then** the confirm action is disabled.
4. **Given** a valid choice and reason, **When** the analyst confirms, **Then** the
   door's tier is saved, the row's Tier and SKUs assorted update, and a message states
   "{door} moved to {tier}. It now receives N SKUs."
5. **Given** a Closed or Cancelled door, **When** it is shown, **Then** its Tier cell is
   read-only.
6. **Given** saving fails, **When** the error returns, **Then** the dialog stays open with
   an error message and the door's tier is unchanged.

---

### User Story 4 - Bulk Update: re-tier many doors (Priority: P2)

The analyst starts Bulk Update from the Doors header (or from "Change tier" in the
selection bar), and is walked through four steps: choose the change ("Re-tier doors"),
choose the doors and the new tier (from their selection, a saved filter, or an uploaded
file), check every row, then review the per-door impact, give a reason, and apply. They
can undo the whole update from the result screen.

**Why this priority**: Cluster reviews and new-door onboarding re-tier dozens to
thousands of doors at once; doing it one door at a time is impractical.

**Independent Test**: Select fixture doors, run the workflow to the result, and verify
each door's tier changed, the impact grid matched engine counts, and Undo restored every
original tier.

**Acceptance Scenarios**:

1. **Given** the analyst is on Doors, **When** they click "Bulk Update" (update icon),
   **Then** the app navigates to the Bulk Update address showing the breadcrumb "Doors",
   eyebrow "Strategy", title "Bulk Update", the "How bulk update works" intro listing the
   four steps (with a "Hide" button), the step indicator (Choose the change · Choose the
   doors · Check the rows · Review and apply), and step 1.
2. **Given** doors are selected on Doors, **When** the analyst clicks "Change tier" in the
   selection bar, **Then** Bulk Update opens at step 2 with "Re-tier doors" chosen and the
   source "Doors selected on the Doors screen (N)" preselected.
3. **Given** step 1, **When** no change type is chosen, **Then** "Continue" is disabled;
   choosing a card marks it "Selected" and enables "Continue"; "Cancel" returns to Doors.
4. **Given** step 2 for re-tiering, **When** the source is "Doors selected…" or "A saved
   filter", **Then** a required "New tier" field is shown; the saved-filter options are
   Needs tier, Opened in last 90 days, and Fragrance-only product line, each with its
   current door count (Closed doors are always left out); "Check the rows" is enabled
   only when at least one door is in scope and a tier is chosen; the helper text states
   "N rows to check."
5. **Given** step 2 with source "Upload a file", **When** the analyst downloads the
   re-tier template, fills it (Door key, Door name, New tier, Reason) and uploads it,
   **Then** the file name and "N rows read" are shown with a "Replace file" link, and
   "Check the rows" is enabled.
6. **Given** step 3, **When** rows are checked, **Then** each row shows its row number,
   Door key, door, change ("{current tier} → {new tier}"), a status (Ready, Warning, No
   change, Skipped, Error) and details, using the rules in FR-040; status totals appear
   above the grid; a "Needs attention" view and a "Download rows that need attention"
   action are available when any row is not Ready.
7. **Given** step 3 has rows that will be left out, **When** shown, **Then** a panel
   states how many rows will be left out and why, and that the analyst can continue
   without them; the continue action reads "Review impact (N rows)" and is disabled with
   "No rows to apply" when nothing applies.
8. **Given** step 4, **When** shown, **Then** a summary sentence (e.g. "12 doors move to
   Premium (8 from Access, 4 from no tier). On average each gains 37 SKUs."), KPI tiles
   (Doors changing, Net SKU change per door (average), SKU changes across doors, Rows
   left out), and a per-door before/after grid (Door, Door key, Tier before, Tier after,
   SKUs before, SKUs after, Difference, Note) are shown, along with "What happens when you
   apply" and a required reason field.
9. **Given** a reason is entered, **When** the analyst clicks "Re-tier N doors", **Then**
   every applicable door's tier is saved and a result screen shows "N doors moved to
   {tier}." with progress (Saved · Assortment updated) and actions "View doors", "Undo
   this update", and "Start another update".
10. **Given** the result screen, **When** the analyst confirms "Undo this update",
    **Then** every door changed by this update returns to its previous tier and the result
    reads "Update undone".
11. **Given** some doors fail to save, **When** applying finishes, **Then** the result
    states how many succeeded and how many failed, lists the failed doors, and offers to
    retry the failed ones; undo reverses only the successful ones.

---

### User Story 5 - Bulk Update: add or remove SKUs at many doors (Priority: P3)

The analyst chooses "Add or remove SKUs at specific doors", picks the doors (selection,
saved filter, or upload) and the SKUs (individually or by franchise/line group) with an
action (Add or Remove), checks every row, reviews, and applies. Each door × SKU pair
becomes one door-level exception.

**Why this priority**: Door exceptions for fixture limits or retailer agreements are less
frequent than re-tiering but equally tedious one by one.

**Independent Test**: Pick three fixture doors and two SKUs with action Add; verify six
rows are checked with the correct statuses and that applying creates one active
door-level Add exception per applicable pair with the given reason.

**Acceptance Scenarios**:

1. **Given** doors are selected on Doors, **When** the analyst clicks "Add exception" in
   the selection bar, **Then** Bulk Update opens at step 2 with "Add or remove SKUs at
   specific doors" chosen and the selection preselected.
2. **Given** step 2 for SKUs, **When** shown, **Then** fields Action ("Add the SKUs" /
   "Remove the SKUs"), "Add SKUs by group" (franchise or line), and a searchable
   multi-select "SKUs" are shown; "Check the rows" is enabled only when at least one door
   and one SKU are chosen.
3. **Given** step 3, **When** rows are checked, **Then** one row per door × SKU (or per
   uploaded row) is labeled using the SKU rules in FR-041.
4. **Given** step 4 and a reason, **When** the analyst clicks "Create N exceptions",
   **Then** one active door-level exception is created per applicable row with the chosen
   action and the reason, and the result reads "N door exceptions created at M doors."
5. **Given** the result screen, **When** the analyst confirms "Undo this update", **Then**
   every exception created by this update is set to status Cancelled (not deleted) and no
   longer affects the assortment.

---

### User Story 6 - Navigate with deep links and breadcrumbs (Priority: P3)

Each Doors sub-screen has its own address and a breadcrumb back to Doors, so users can
bookmark, reload, and use browser back/forward without losing their place.

**Why this priority**: Consistent with the app shell spec; protects work in progress.

**Independent Test**: Open the Bulk Update address directly, reload mid-workflow, and use
back/forward; confirm breadcrumbs and highlighted navigation remain correct.

**Acceptance Scenarios**:

1. **Given** any Doors sub-screen (Bulk Update, Door detail), **When** shown, **Then** the
   "Doors" navigation entry stays highlighted and the breadcrumb "Doors" returns to Doors.
2. **Given** the Bulk Update address is opened directly (no selection), **When** step 2
   is reached, **Then** the "Doors selected on the Doors screen (none selected)" option is
   disabled and the default source is "A saved filter" for re-tiering or "Upload a file"
   for SKUs.
3. **Given** the analyst returns to Doors via the breadcrumb, "Cancel", or "View doors",
   **Then** Doors shows the filters and selection that were active before leaving (after
   "View doors", the selection is cleared).
4. **Given** the old Mass update address is opened, **When** it loads, **Then** the app
   shows Bulk Update.

---

### Edge Cases

- **No doors loaded / data load fails**: the grid region shows the shared loading state,
  then either an empty state ("No doors match these filters. Clear a filter to widen the
  list.") or an error state with Retry; filters are kept.
- **No tiers defined**: the Tier cell shows "Needs tier" for every door and the tier
  pickers show no options; Bulk Update re-tiering cannot proceed past step 2.
- **Selection across pages**: selected doors remain selected when paging, sorting, or
  filtering; the selection bar count reflects all selected doors, including hidden ones.
- **Selected door later filtered out**: it stays selected and is included in Bulk Update
  and Export selection.
- **Missing opening date**: the door is excluded from "Opened in last 90 days".
- **Upload with unknown Door key, unknown tier name, unknown SKU key, wrong extension,
  empty file, or too many rows** (> 2,500 for re-tier, > 5,000 for SKUs): unknown values
  become Error rows; wrong extension, empty file, or too many rows is rejected at upload
  with a message and nothing is read.
- **Duplicate rows in an upload** (same door, or same door × SKU): the last row wins for
  re-tiering; duplicate SKU rows are marked "No change" after the first.
- **Leaving Bulk Update mid-workflow**: navigating away discards unapplied choices; no data
  is written before "Apply".
- **Very large grids** (up to 5,000 doors): filtering, sorting, and paging stay responsive.
- **Partial failure during apply or undo**: reported per door; nothing is silently lost.
- **Concurrent change**: a door whose tier or exceptions were changed by someone else
  between "Check the rows" and Apply is skipped and listed on the result screen; other
  rows are still applied.

## Requirements _(mandatory)_

### Functional Requirements

**Doors header and filters**

- **FR-001**: The Doors screen MUST show the page header with eyebrow "Strategy", title
  "Doors", a description "N door(s) match(es) the current filters." followed by "M doors
  need a tier." or "Every door has a tier.", and header actions "Export" (download icon)
  and "Bulk Update" (update icon).
- **FR-002**: "Bulk Update" MUST be the primary (emphasized) header action when no doors
  are selected and a secondary action when doors are selected (the selection bar's
  "Change tier" becomes the primary action).
- **FR-003**: The screen MUST provide a search box ("Search door name, Door key or SAP
  Ship To") matching case-insensitively on door name, Door key, and SAP Ship To.
- **FR-004**: The screen MUST provide multi-select filters Distributor name (options from
  distinct distributor names in the data) and Tier (every active tier ordered by rank,
  plus "Needs tier").
- **FR-005**: A "More filters" button (filter icon) MUST reveal single-select filters
  Online / offline, Door type, Product line, and Door status (options from distinct values
  in the data), toggle its label to "Fewer filters", show the count of set hidden filters
  in parentheses, and clear those filters when collapsed. It MUST start expanded if any of
  those filters is set.
- **FR-006**: The screen MUST show a "Saved filters" row of checkable tags, in this order:
  "Needs tier", "Fragrance-only product line", "Opened in last 90 days", "Closed". At most
  one may be checked at a time. "Q3 cluster review" MUST NOT be shown.
- **FR-007**: Saved filter definitions: **Needs tier** = door has no tier; **Fragrance-only
  product line** = door's product line is exactly "Fragrance" (the same text as the SKU
  axis "Fragrance", so the door receives only Fragrance-axis SKUs); **Opened in last 90
  days** = the door's original opening date (not the last opening date) is between today −
  90 days and today inclusive; **Closed** = door
  status is "Closed" or "Cancelled".
- **FR-008**: By default (no "Closed" saved filter and no Door status filter), Closed and
  Cancelled doors MUST be hidden. When the Door status filter is set, it replaces this
  default; when "Closed" is checked, only Closed and Cancelled doors show.
- **FR-009**: All filters, search, and the saved filter MUST combine with AND logic.
- **FR-010**: A "Clear filters" link MUST appear whenever any filter, search, or saved
  filter is active and reset all of them (and collapse "More filters").

**Doors grid**

- **FR-011**: The grid MUST show, in order: Door name, Door key, Tier, SKUs assorted,
  Distributor name, Product line, Door type, Online / offline, Sales channel, Exceptions,
  Door status, SAP Ship To, Last changed on. Door name and Door key MUST be pinned.
- **FR-012**: "SKUs assorted" MUST be the Assortment Engine's derived count for doors with
  a tier that are not Closed/Cancelled, and empty otherwise.
- **FR-013**: "Exceptions" MUST show the count of active door-level exceptions on the door.
- **FR-014**: "Door status" MUST be shown as a status indicator whose tone reflects the
  status: Open = success, Pre-Trade = info, Closed and Cancelled = unavailable, Project
  (MTP) = neutral; any other value = neutral, matching the prototype.
- **FR-015**: "Last changed on" MUST show the door record's last-modified date and the
  initials of the user who modified it (see Data Gaps).
- **FR-016**: The grid MUST be sortable by Door name (default, ascending), Tier, SKUs
  assorted, Distributor name, and Last changed on.
- **FR-017**: The grid MUST page 50 rows at a time with a "{first}–{last} of {total}"
  indicator and MUST keep selection across pages, sorts, and filter changes.
- **FR-018**: Each row MUST have a selection checkbox labeled "Select {door name}", and
  activating a row (click outside interactive cells, or Enter) MUST navigate to that
  door's Door detail address.
- **FR-019**: When at least one door is selected, a selection bar MUST show "N door(s)
  selected" and actions "Change tier" (primary), "Add exception", "Export selection", and
  "Clear selection".
- **FR-020**: The grid region MUST show loading, error (with Retry, keeping filters), and
  empty ("No doors match these filters. Clear a filter to widen the list.") states, and
  its label MUST read "N door(s)".

**Export**

- **FR-021**: "Export" MUST download an Excel workbook (.xlsx) of every door in the
  current filtered and sorted list (all pages) whose columns are exactly the grid's columns
  (FR-011), in the same order, with the same headers and the displayed values (e.g. tier
  name or "Needs tier", status label, formatted "Last changed on"). File name:
  `Doors_filtered_{YYYY-MM-DD}.xlsx`.
- **FR-022**: "Export selection" MUST produce the same workbook for the selected doors
  only, named `Doors_selection_{YYYY-MM-DD}.xlsx`.
- **FR-023**: After any export the app MUST show a confirmation message "Door list
  exported · N door(s)".

**Inline tier change**

- **FR-024**: For doors that are not Closed/Cancelled, the Tier cell MUST be an inline tier
  picker ("Assign tier" placeholder when empty, warning indicator when the door has no
  tier). Interacting with the picker MUST NOT trigger row navigation.
- **FR-025**: Picking a tier MUST open a confirmation dialog with the question, the new-tier
  field, the impact text (FR-026), and a required reason field ("Why is this change being
  made?", up to 280 characters, with suggested reasons that can be picked). The confirm
  action MUST be disabled until a different tier is chosen and a reason is entered.
- **FR-026**: The impact text MUST state the retail and SPM SKU counts and total the door
  will receive under the new tier (from the engine), the difference against today when the
  door already has a tier, a note when the door's product line limits the axes it
  receives, and a note for Project (MTP) doors that nothing reaches SAP until Pre-Trade.
- **FR-027**: Confirming MUST save the door's tier, refresh the door's row and the header
  counts, and show the success message from US3. The reason MUST be handled per
  FR-055.

**Bulk Update — structure and navigation**

- **FR-030**: The sub-screen formerly titled "Mass update" MUST be titled "Bulk Update" and
  live at its own address under Doors; the previous Mass update address MUST lead to it.
  Its header MUST show the breadcrumb "Doors", eyebrow "Strategy", and description "Change
  many doors at once. You see every row checked and the impact per door before anything
  is saved." (after applying: "Update applied. Follow its progress below; you can undo it
  from here.").
- **FR-031**: Bulk Update MUST show a "How bulk update works" intro with four numbered
  items (1 Choose the change; 2 Choose the doors; 3 Check the rows; 4 Review and apply,
  each with the prototype's one-line explanation) and a "Hide" button that hides it for the
  rest of the session.
- **FR-032**: A four-step indicator MUST show the current step; completed steps show a
  short summary (chosen change; number of rows; number to apply).
- **FR-033**: Entering from "Change tier" or "Add exception" with a selection MUST start at
  step 2 with the matching change type and source preselected; entering from the header
  "Bulk Update" MUST start at step 1, carrying any current selection.
- **FR-034**: "Back" MUST return to the previous step keeping choices; "Cancel" (step 1)
  and the breadcrumb MUST return to Doors. No data is written before Apply.

**Bulk Update — step 1: Choose the change**

- **FR-035**: Step 1 MUST present two selectable cards — "Re-tier doors" and "Add or remove
  SKUs at specific doors" — each with its description and facts (Changes, Who/Your scope,
  Limit, Afterwards) as in the prototype, plus a redirect panel "SKUs for a whole tier or
  retailer?" with actions "Open Tier assortments" and "Add a retailer exception" (opens the
  Exceptions screen). "Continue" is enabled only after a card is chosen.

**Bulk Update — step 2: Choose the doors**

- **FR-036**: Step 2 MUST offer the source options "Doors selected on the Doors screen
  (N)" (disabled when none selected), "A saved filter", and "Upload a file", and list the
  first four selected door names "and N more" for the selection source.
- **FR-037**: The saved-filter source MUST offer Needs tier, Opened in last 90 days, and
  Fragrance-only product line, each labeled with its current count of non-Closed doors.
- **FR-038**: For re-tiering (non-upload) a required "New tier" picker MUST be shown; for
  SKUs, Action (Add/Remove), "Add SKUs by group" (franchise or line, adding all their
  SKUs), and a searchable "SKUs" multi-select MUST be shown.
- **FR-039**: The upload source MUST show (1) the template columns with required/optional
  flags and rules and a "Download template" button (download icon) that downloads an
  .xlsx template with those columns and an example row, and (2) a drag-and-drop/browse
  upload area accepting .xlsx or .csv up to 2,500 rows (re-tier) or 5,000 rows (SKUs),
  then showing "{file name} · N rows read" with "Replace file". Uploaded rows match doors
  on Door key.

**Bulk Update — step 3: Check the rows**

- **FR-040**: Re-tier rows MUST be labeled, first matching rule wins: Error "Door key not
  found in the door list…" ; Error "“{value}” is not a tier. Use {active tiers}." ;
  Skipped "{status}: tiers are not changed on closed or cancelled doors." ; No change
  "Already {tier}." ; Warning "Product line {line}: it moves, but receives SKUs of those
  axes only." when the product line limits the axes ; Warning "Project door (MTP): the tier is
  saved; nothing goes to SAP until it is Pre-Trade." when status is Project (MTP) ; otherwise Ready.
- **FR-041**: SKU rows MUST be labeled, first matching rule wins: Error door not found ;
  Error "SKU key {key} is not in the catalogue." ; Skipped door Closed/Cancelled ; Skipped
  "The door has no tier yet, so it has no assortment to change." ; Skipped (Add only) SKU
  axis does not match the door's product line ; Error "This door already has an exception
  for this SKU. Change it on the door." ; No change "Already receives this SKU." (Add) or
  "Does not receive this SKU today." (Remove) ; otherwise Ready.
- **FR-042**: Step 3 MUST show status totals, a left-out panel when any row is Error,
  Skipped, or No change (critical tone when errors exist), an "All rows (N)" / "Needs
  attention (N)" switch, a "Download rows that need attention" action (download icon,
  .xlsx with Row, Door key, Door, Change, Status, Details), and the rows grid (paged at 100
  when larger). Only Ready and Warning rows are applied.

**Bulk Update — step 4: Review and apply**

- **FR-043**: Step 4 MUST show the summary sentence, KPI tiles ("Doors changing"; "Net SKU
  change per door (average)" for re-tier or "Door exceptions created" for SKUs; "SKU
  changes across doors"; "Rows left out" with an errors/"Nothing to fix" status), and the
  per-door impact grid with engine-derived SKU counts before and after.
- **FR-044**: Step 4 MUST list "What happens when you apply" (saved immediately; every
  screen shows the new assortment straight away; undo is available from the confirmation
  screen) and a required reason field, and the apply button MUST read "Re-tier N doors" or
  "Create N exceptions" and be disabled until a reason is entered.

**Bulk Update — apply, result, undo**

- **FR-045**: Applying a re-tier MUST save each applicable door's tier; applying a SKU
  update MUST create one active door-level exception per applicable row with the chosen
  action and the reason. Immediately before saving, each row MUST be re-validated against
  the latest data; a row whose door tier or exceptions changed since step 3 MUST be skipped
  and listed on the result screen as "Changed by someone else — not updated".
- **FR-046**: The result screen MUST show a success (or "Update undone") result with title
  and subtitle, a progress indicator (Saved · Assortment updated), a polite live-region
  status message, and actions "View doors" (primary), "Undo this update" (with a
  confirmation), and "Start another update".
- **FR-047**: Undo MUST restore each re-tiered door's previous tier, or set each exception
  created to status Cancelled (records are kept, not deleted), for the update just applied
  in the current session.
- **FR-048**: Partial failures during apply or undo MUST be reported with counts and the
  affected doors, and MUST offer a retry for the failed rows.
- **FR-049**: After apply or undo, the Doors grid, header counts, and engine-derived SKU
  counts MUST reflect the change without a full page reload.

**General**

- **FR-050**: All UI MUST use the project's Ant Design–based components (or their shared
  ChanelUI-style wrappers) wherever an equivalent exists, styled only via design tokens.
- **FR-051**: Doors, Bulk Update, and Door detail MUST each have their own address;
  sub-screens MUST keep "Doors" highlighted in navigation and show the "Doors" breadcrumb.
- **FR-052**: Returning to Doors from a sub-screen MUST restore the prior filters, saved
  filter, search, sort, page, and selection for the session.
- **FR-053**: The screens MUST meet WCAG 2.1 AA (labeled controls, keyboard operation of
  grid, tags, cards, steps, dialogs, and upload; visible focus; announced status changes)
  and be usable at every responsive tier defined by the app shell.
- **FR-054**: The screen MUST match the prototype's layout, component anatomy, copy (as
  adapted above), and responsive behavior.
- **FR-055**: Tier-change reasons (inline dialog and Bulk Update re-tier) MUST be required,
  as in the prototype, but are kept only for the current session (shown in confirmation
  and result messages) and are not saved, because doors have no reason field and the
  Activity log is excluded. The reason field's help text MUST say that the reason is not
  saved for tier changes. Reasons for SKU exceptions MUST be saved on each exception.

### Key Entities

- **Door**: a point of sale. Attributes used: name, Door key, SAP Ship To/Sold To,
  distributor name and code, online/offline, door type, product line, sales channel,
  door status, opening date, tier, last modified date and user.
- **Tier**: named, ranked assortment level; active tiers populate pickers and filters.
- **SKU**: product with key, name, axis, franchise, line, and type (Retail/SPM).
- **Assortment exception**: door- or retailer-level Add/Remove of a SKU with status and
  reason; this feature creates and cancels door-level exceptions.
- **Saved filter**: a fixed, named door predicate (Needs tier, Fragrance-only product line,
  Opened in last 90 days, Closed); not user-editable.
- **Bulk update session**: transient workflow state — change type, source, scope doors,
  tier or SKUs/action, uploaded rows, row check results, reason, and the applied changes
  needed for undo. Not persisted.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An analyst can find a specific door by name or key and open it in under 15
  seconds.
- **SC-002**: Applying or clearing any filter updates the grid in under 1 second for 5,000
  doors.
- **SC-003**: Exported workbooks match the on-screen filtered list row-for-row and
  column-for-column in 100% of tested cases.
- **SC-004**: An analyst can re-tier 100 doors via Bulk Update, from opening the workflow to
  the result screen, in under 3 minutes.
- **SC-005**: 100% of uploaded rows receive a status and, for non-Ready rows, a
  human-readable reason before anything is saved.
- **SC-006**: Undo restores 100% of the successfully applied changes of the update.
- **SC-007**: In side-by-side review, reviewers confirm the Doors and Bulk Update screens
  look and behave like the prototype at compact, standard, and wide sizes.
- **SC-008**: Automated accessibility checks report zero WCAG 2.1 AA violations on Doors,
  each Bulk Update step, the result screen, and the tier dialog.

## Assumptions

- Door status values in the data are Open, Pre-Trade, Project (MTP), Closed, and
  Cancelled (confirmed); "Closed" and "Cancelled" identify closed doors.
- Fragrance-only doors are those whose product line is "Fragrance", matching the SKU axis
  "Fragrance" (confirmed).
- "Opened in last 90 days" uses the door's original opening date relative to the current
  date (the prototype's fixed demo dates are not reused).
- Columns labeled in the prototype as Product line, Door type, Online / offline, and Sales
  channel map to the door's product line, door type, online/offline, and sales channel
  fields.
- No user roles exist in the data; every user can change tiers, run Bulk Update, and add
  exceptions. SKU-family scoping (retail vs SPM by role) is not applied.
- Undo is available only on the result screen of the update just applied in the current
  session (constitution: Bulk Update without import-batch tracking).
- The "SAP rows for the next export" KPI is shown as "SKU changes across doors" (sum of
  SKUs added and removed per door), because Exports is excluded.
- Workbook generation and reading for export, template, upload, and "rows that need
  attention" use the Excel library requested by the user.
- "Add exception" with a single selected door also opens Bulk Update (SKU change), since
  the single-exception form belongs to the Exceptions spec.
- Door detail content remains a placeholder until its own spec; this feature only links
  to it.
- Saved filters are hardcoded; users cannot create, rename, or delete them.

## Clarifications

### Session 2026-10-27

- Q: How are tier-change reasons handled, given that doors have no reason field and Activity is excluded? → A: The reason stays required, as in the prototype, but is kept only for the current session and is not saved (FR-055).
- Q: What identifies a fragrance-only door? → A: The door's product line is "Fragrance", the same text as the SKU axis "Fragrance" (FR-007).
- Q: Which door status values mean closed? → A: "Closed" and "Cancelled" (FR-007, FR-008).
- Q: Which other door statuses exist (for status tones and the Project warning)? → A: Open, Pre-Trade, Project (MTP), Closed, and Cancelled, as in the prototype; unknown values are shown as neutral (FR-014, FR-026, FR-040).
- Q: Does undo cancel or delete the exceptions a Bulk Update created? → A: It sets them to status Cancelled; records are kept (FR-047, US5).
- Q: Which date drives "Opened in last 90 days"? → A: The original opening date only; the last opening date is ignored (FR-007).
- Q: What happens to a door changed by someone else between checking rows and Apply? → A: It is re-checked at Apply, skipped if it changed, and listed on the result screen (FR-045).
- Q: Which columns does the Excel export contain? → A: Exactly the grid's 13 columns, in the same order, with the displayed values; the prototype's code-based layout is not used (FR-021).

## Data Gaps

| Needed by this feature                            | Available in generated services       | Handling                                                           |
| ------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| Q3 cluster review membership                      | No field on Door                      | Saved filter removed from Doors and Bulk Update.                   |
| Internal-territory flag ("Not tiered (internal)") | No field on Door                      | Option and skip rule removed.                                      |
| Tier-change date and user ("Tier changed on")     | Only record-level modified on/by      | Column shows record "Last changed on" (any change, not only tier). |
| Tier-change reason                                | No field on Door; Change log excluded | Required but kept only for the session (FR-055).                   |
| User roles / permissions                          | None                                  | All actions available to all users.                                |
| Import batch tracking for bulk updates            | Import run excluded                   | Undo limited to the current session's last update.                 |

## Verification & Known Limitations

To be completed at implementation (constitution XIV): unit test results and coverage,
Playwright viewport matrix and screenshot comparison results, accessibility results,
untested scenarios, and deviations. Known from the outset: single caps-only licensed font
face (weights render as Regular); the deviations listed in the Overview table and Data
Gaps above.
