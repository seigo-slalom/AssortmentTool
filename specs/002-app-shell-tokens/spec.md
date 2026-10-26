# Feature Specification: App Shell & Design Tokens

**Feature Branch**: `002-app-shell-tokens`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "Feature 002. Build out the shell and style tokens. The shell should match the #Assortment-Tool-Prototype.html file is listed out based on branding/colors and font. Every screen should have it's own file structure. There must be a token.ts file created that tokenizes style attributes and font configurations. Files MUST use tokens, no hardcoded css values inline the code. Use playwright to test out the responsiveness on different screen sizes, structure of pages, and overall feel of the app. Unit tests must be written for this spec in regards to the UI and UX. Make sure to follow what is in the prototype, unless a screen has been flagged to not be created prior to this prompt. The goal is to create a similar look and feel to the prototype from a UX perspective."

## Overview

This feature replaces the starter placeholder UI with the Assortment Tool's branded
application frame ("shell") and the single source of styling truth ("design tokens"). It
reproduces the look, feel, navigation, and responsive behavior of
`docs/Assortment-Tool-Prototype.html` for the **in-scope** screens only, so that later
specs can fill each screen with engine-backed content without revisiting layout, brand, or
navigation.

**In scope (navigation destinations, in prototype order)**: Overview, Doors, Tier
assortments, Exceptions.

**In scope (sub-screens without their own navigation entry)**: Door detail (reached from
Doors) and Mass update (reached from Doors). While on a sub-screen, the navigation entry it
came from stays highlighted, matching the prototype.

**Excluded (flagged by the constitution; never built, stubbed, or shown in navigation)**:
Explorer, Exports, Activity, Data sources, Parking lot. Prototype-only "demo" controls
(the "Viewing as" persona switcher and the standard/dense density toggle) are also not
reproduced as user-facing controls.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Recognizable branded frame on launch (Priority: P1)

A business tester opens the Assortment Tool and immediately sees the same branded frame as
the prototype: the "Assortment tool" app name in the header, a side navigation listing the
in-scope destinations with their prototype icons, a warm canvas background, ink-black
text, and the Chanel display and text typefaces. The Overview screen is selected by
default and shows its page header ("Fragrance & Beauty · United States" eyebrow and
"Overview" title).

**Why this priority**: Every other screen and spec depends on the frame. Without it, no
content can be delivered with prototype fidelity, and testers cannot orient themselves.

**Independent Test**: Launch the app with no data loaded and compare the frame side by side
with the prototype at the same viewport. Delivers value on its own because it establishes
brand, orientation, and navigation for all later specs.

**Acceptance Scenarios**:

1. **Given** the app has finished starting, **When** the tester lands on it, **Then** the
   header shows the app name "Assortment tool", the side navigation lists exactly Overview,
   Doors, Tier assortments, and Exceptions in that order, and Overview is the selected item.
2. **Given** the shell is displayed, **When** the tester inspects the typography, **Then**
   the app name, page titles, eyebrows, and region labels render uppercase in the display
   typeface at regular weight, while side-navigation labels and body text render in mixed
   case in the text typeface, exactly as in the prototype.
3. **Given** the shell is displayed, **When** colors are compared with the prototype,
   **Then** canvas, paper, ink, muted ink, border, and selected-navigation colors match the
   canonical brand palette with no additional colors introduced.
4. **Given** the app is still starting up or startup fails, **When** the tester waits,
   **Then** a branded loading state or a branded, readable error message is shown instead
   of a blank screen.

---

### User Story 2 - Navigate between in-scope screens (Priority: P1)

A tester moves between Overview, Doors, Tier assortments, and Exceptions using the side
navigation, and reaches Door detail and Mass update from Doors. Each screen shows its own
prototype page header (eyebrow, title, and description where the prototype has one) and a
clearly labeled region stating that its content arrives in a later spec.

**Why this priority**: Navigation and per-screen structure are the backbone every later
screen spec plugs into; they are as critical as the frame itself.

**Independent Test**: Click each navigation entry and use direct links to each sub-screen;
verify the correct page header, selected navigation entry, browser address, and page title
for every screen.

**Acceptance Scenarios**:

1. **Given** the tester is on any screen, **When** they choose a navigation entry, **Then**
   the matching screen is shown, that entry becomes the only selected entry, and the
   address reflects the screen so it can be bookmarked and reloaded.
2. **Given** the tester opens Door detail or Mass update, **When** the screen renders,
   **Then** the Doors navigation entry remains selected and a clear way back to Doors is
   available.
3. **Given** the tester enters an address that does not match any in-scope screen
   (including the addresses of excluded screens such as Explorer or Parking lot), **When**
   it loads, **Then** a branded "page not found" state is shown inside the shell with a
   link back to Overview, and no excluded screen content is rendered.
4. **Given** a screen's real content is not delivered yet, **When** it is shown, **Then**
   the content area displays a visibly labeled placeholder region (never sample or mock
   data) that names the later spec responsible for it.
5. **Given** the tester uses the browser back and forward controls, **When** they move
   through history, **Then** the shell shows the matching screen and selection each time.

---

### User Story 3 - Usable on every monitor and phone size (Priority: P1)

A tester opens the app on a phone, a tablet, a laptop, and a large monitor. The shell
adapts the way the prototype does: below 992 px wide the side navigation collapses behind
a menu button that opens a navigation drawer and touch targets grow to at least 44 px;
between 992 px and 1599 px the side navigation rail is always visible; from 1600 px up the
content widens with roomier spacing and never exceeds a 2200 px content width.

**Why this priority**: The constitution requires every screen to be usable on all monitor
and mobile sizes; failing this blocks any later screen from being accepted.

**Independent Test**: Load each in-scope screen at each viewport in the matrix (360×740,
390×844, 768×1024, 1024×768, 1366×768, 1920×1080, 2560×1440) and check navigation mode,
overflow, and spacing.

**Acceptance Scenarios**:

1. **Given** a viewport narrower than 992 px, **When** any screen loads, **Then** the side
   navigation is hidden, a labeled menu button is shown in the header, and activating it
   opens a navigation drawer that closes after a destination is chosen, on Escape, or on
   clicking outside it.
2. **Given** a viewport from 992 px to 1599 px, **When** any screen loads, **Then** the
   navigation rail is visible beside the content, no drawer menu button is shown, and the
   header shows a "Collapse navigation" toggle that narrows the rail to icons only
   ("Expand navigation" restores it), as in the prototype.
3. **Given** a viewport of 1600 px or wider, **When** any screen loads, **Then** the wide
   spacing tier applies and content never grows wider than 2200 px.
4. **Given** any viewport in the matrix, **When** any screen loads, **Then** the page has
   no horizontal scrolling of the document and the header, navigation access, and page
   header are visible and operable.
5. **Given** the viewport is resized across a tier boundary, **When** the resize ends,
   **Then** the shell switches navigation mode without a reload and without losing the
   current screen.

---

### User Story 4 - Accessible, keyboard-friendly shell (Priority: P2)

A tester who relies on a keyboard or assistive technology can reach and operate every
shell control. Focus is always visible as the prototype's 3 px ink focus ring, landmarks
are announced correctly, and motion is reduced when the operating system asks for it.

**Why this priority**: WCAG 2.1 AA is a project-wide requirement, but it builds on the
frame and navigation delivered by stories 1–3.

**Independent Test**: Navigate the full shell using only the keyboard and a screen reader
at a standard and a compact viewport; run automated accessibility checks on every screen.

**Acceptance Scenarios**:

1. **Given** any screen, **When** the tester presses Tab from the top of the page, **Then**
   the first focusable control is a "Skip to main content" link that moves focus to the
   main content area.
2. **Given** any focusable shell control, **When** it receives keyboard focus, **Then** a
   visible 3 px ink focus ring with a 2 px offset is shown.
3. **Given** the navigation, **When** read by assistive technology, **Then** it is exposed
   as a labeled navigation landmark and the selected entry is announced as the current page.
4. **Given** the compact navigation drawer is open, **When** the tester presses Tab
   repeatedly, **Then** focus stays within the drawer until it is closed, after which focus
   returns to the menu button.
5. **Given** the operating system requests reduced motion, **When** the drawer opens or
   navigation changes, **Then** transitions are removed or reduced.
6. **Given** any screen, **When** the page title is read, **Then** it names the current
   screen followed by the app name.

---

### User Story 5 - One source of styling truth (Priority: P2)

A developer or reviewer changing the look of the app finds every color, typeface, font
size, line height, font weight, spacing value, radius, shadow, size, breakpoint, motion
duration, and layering value defined once in a single design-token file. Every shell
element and screen takes its styling from those tokens, so a token change is reflected
everywhere and nothing is hardcoded.

**Why this priority**: Required by the constitution (Design Tokens principle) and by the
user, and it protects brand fidelity for every later spec. It is P2 only because its value
is realized through stories 1–4.

**Independent Test**: Change a single token value in a local build and observe the change
across all screens; run the automated token-parity and no-hardcoded-values checks.

**Acceptance Scenarios**:

1. **Given** the design-token file, **When** it is compared with the constitution's
   Canonical Brand Tokens, **Then** every family, weight, color, type-scale entry (standard
   and dense), spacing, radius, shadow, size, breakpoint, and motion value matches exactly.
2. **Given** any shell or screen source file outside the token file, **When** it is
   scanned, **Then** it contains no hardcoded color values, pixel font sizes, font-family
   names, or literal spacing/size numbers used for styling.
3. **Given** the component library theme, global style variables, and chart palette,
   **When** they are inspected, **Then** each value is derived from the token file.
4. **Given** the single licensed font file, **When** the app loads, **Then** it is served
   with the app (no remote font source), registered under both the display and text family
   names, and faux bold/italic synthesis is disabled.

---

### User Story 6 - Automated proof of look, structure, and feel (Priority: P3)

A reviewer can rely on automated checks rather than manual inspection to confirm the shell
matches the prototype, behaves correctly across screen sizes, and stays that way as later
specs land.

**Why this priority**: Required for spec completion (constitution Principles XI and XIV),
but delivers value only once the shell exists.

**Independent Test**: Run the unit test suite with coverage and the end-to-end viewport
suite; both pass with no manual steps and without a live data environment.

**Acceptance Scenarios**:

1. **Given** the unit test suite, **When** it runs with coverage, **Then** all tests pass
   and line, branch, function, and statement coverage are 100% for the code added by this
   spec.
2. **Given** the end-to-end suite, **When** it runs for every in-scope screen at every
   viewport in the matrix, **Then** it verifies navigation mode per tier, absence of
   horizontal overflow, visibility and operability of the header, navigation access, and
   page header, and visible keyboard focus.
3. **Given** committed baseline images captured from the prototype with the same bundled
   font, **When** each in-scope screen is captured at each viewport with data-bearing
   regions masked, **Then** the app's chrome, typography, and color differ from the
   baseline by no more than 1% of pixels.
4. **Given** the end-to-end suite, **When** it runs, **Then** it uses deterministic fixtures
   and never contacts a live data environment.

---

### Edge Cases

- **Exactly at a breakpoint** (991, 992, 1599, 1600 px wide): 992 px and above uses the
  standard tier; 1600 px and above uses the wide tier.
- **Very narrow phones** (down to 320 px): the header keeps the menu button and app name
  visible without overlap or document horizontal scrolling; long page titles wrap.
- **Very wide monitors** (above 2560 px): content stays capped at 2200 px; the remaining
  space shows canvas background.
- **Drawer open while resizing to standard/wide**: the drawer closes and the rail appears;
  focus is not lost.
- **Font file fails to load**: text falls back to the prototype's fallback family stack
  (Georgia/Times for display; Helvetica Neue/Arial for text) and layout remains usable.
- **Browser zoom at 200%**: shell remains operable with no loss of content or function
  (WCAG reflow), switching to the compact tier when the effective width falls below 992 px.
- **Deep link to a sub-screen** (Door detail, Mass update) without a selected door: the
  sub-screen shell and header render with its labeled placeholder; Doors stays selected.
- **Addresses of excluded screens**: treated as not found; no navigation entry, link, or
  content for an excluded screen is ever rendered.
- **Startup host error / not signed in**: a branded error state inside the canvas explains
  the problem in plain language; navigation is not shown until startup succeeds.
- **High-contrast / forced-colors mode**: the selected navigation entry and focus ring
  remain distinguishable.

## Requirements _(mandatory)_

### Functional Requirements

**Shell frame**

- **FR-001**: The app MUST present a persistent shell consisting of a header (56 px tall)
  showing the app name "Assortment tool", a side navigation, and a main content area on
  the canvas background, matching the prototype's layout and anatomy.
- **FR-002**: The side navigation MUST list exactly Overview, Doors, Tier assortments, and
  Exceptions, in that order, each with the prototype's icon (dashboard, shopping, table,
  filter) and label, as a flat, always-expanded list.
- **FR-003**: The selected navigation entry MUST use the prototype's selected treatment
  (ink background, white text) and MUST be the only selected entry.
- **FR-004**: The shell MUST NOT render navigation entries, links, routes, or placeholders
  for Explorer, Exports, Activity, Data sources, or Parking lot, nor the prototype's demo
  persona switcher or density toggle.
- **FR-005**: The header MUST reserve an actions area on its trailing side, consistent with
  the prototype, so later specs can add header actions without layout change; it is empty
  in this spec.
- **FR-006**: The shell MUST show branded loading and error states during app startup and
  MUST NOT show navigation until startup succeeds.

**Screens and navigation**

- **FR-007**: Each in-scope screen (Overview, Doors, Door detail, Mass update, Tier
  assortments, Exceptions) MUST have its own dedicated, self-contained screen module, so
  later specs can build each screen without touching others.
- **FR-008**: Each screen MUST display the prototype's page header anatomy (optional
  breadcrumb, eyebrow, title, optional description, optional actions) with this copy:

  | Screen           | Breadcrumb | Eyebrow                            | Title                                                       |
  | ---------------- | ---------- | ---------------------------------- | ----------------------------------------------------------- |
  | Overview         | —          | Fragrance & Beauty · United States | Overview                                                    |
  | Doors            | —          | Strategy                           | Doors                                                       |
  | Door detail      | Doors      | Strategy                           | Door detail (replaced by the door's name in the Doors spec) |
  | Mass update      | Doors      | Strategy                           | Mass update                                                 |
  | Tier assortments | —          | Strategy                           | Tier assortments                                            |
  | Exceptions       | —          | Strategy                           | Exceptions                                                  |

  Prototype descriptions and actions are data-driven and are left empty in this spec.

- **FR-009**: Each screen's content area MUST show a visibly labeled placeholder region
  stating that the content is delivered by a later spec; no prototype sample data,
  illustrative counts, or mock records may appear.
- **FR-010**: Each screen MUST have a stable, bookmarkable address; reloading or opening
  that address MUST show the same screen and selection.
- **FR-011**: Door detail and Mass update MUST keep the Doors navigation entry selected and
  MUST show a "Doors" breadcrumb that returns to Doors.
- **FR-012**: Any unknown address MUST show a branded "page not found" state within the
  shell with a link back to Overview.
- **FR-013**: The browser page title MUST read "<Screen title> · Assortment tool" for every
  screen.
- **FR-014**: The placeholder starter content currently shown by the app MUST be removed
  and replaced by the shell.

**Responsive behavior**

- **FR-015**: The shell MUST implement three layout tiers based on viewport width:
  compact (< 992 px), standard (992–1599 px), and wide (≥ 1600 px).
- **FR-016**: In the compact tier, navigation MUST move into a 300 px drawer opened by a
  40 px labeled menu button in the header; all interactive shell controls MUST be at least
  44 × 44 px; compact spacing values MUST apply.
- **FR-017**: In the standard and wide tiers, a 240 px navigation rail MUST be visible and
  the drawer menu button MUST NOT be shown; navigation items MUST be 40 px tall. The header
  MUST show a rail toggle labeled "Collapse navigation" / "Expand navigation" that narrows
  the rail to a 64 px icons-only rail and back; collapsed entries keep an accessible name.
  The collapsed state lasts for the session only.
- **FR-018**: Content padding, section gap, and region gap MUST follow the compact /
  standard / wide token values (16/24/32, 12/20/28, 8/16/20 px), and content width MUST be
  capped at 2200 px.
- **FR-019**: No in-scope screen may produce horizontal scrolling of the document at any
  width from 320 px upward.
- **FR-020**: The layout tier MUST update live when the viewport is resized, without a
  reload and without losing the current screen.

**Accessibility**

- **FR-021**: The shell MUST provide a "Skip to main content" link as the first focusable
  element, and banner, navigation (labeled), and main landmarks.
- **FR-022**: Every focusable shell element MUST show a 3 px ink focus ring with a 2 px
  offset when focused via keyboard.
- **FR-023**: The selected navigation entry MUST be announced as the current page.
- **FR-024**: The compact drawer MUST trap focus while open, close on Escape or outside
  click, and return focus to the menu button when closed.
- **FR-025**: Motion (drawer, selection, hover transitions) MUST use the token durations
  and easing and MUST be reduced or removed when the user prefers reduced motion.
- **FR-026**: Shell text and controls MUST meet WCAG 2.1 AA contrast in every state
  (default, hover, selected, focus, disabled).

**Design tokens and brand**

- **FR-027**: A single design-token file MUST define all visual constants — font
  families, font sizes, line heights, font weights, colors, spacing, radius, shadows,
  component sizes, breakpoints, motion durations/easing, and layering (z-index) — with the
  exact values listed in the constitution's Canonical Brand Tokens, including both standard
  and dense type-scale variants.
- **FR-028**: The UI component library theme, global style variables (e.g. ink, canvas,
  display font, text font), and chart palette MUST be derived from the token file and not
  defined independently.
- **FR-029**: Outside the token file, no shell, screen, or shared component source MUST
  contain hardcoded color values, pixel font sizes, font-family names, or literal spacing,
  size, radius, shadow, or duration values for styling.
- **FR-030**: The licensed font file MUST be bundled with the app (no remote source) and
  registered under both "ABChanel Corpo Display" and "ABChanel Corpo Text"; font synthesis
  MUST be disabled.
- **FR-031**: Display-style text (app name, page titles, eyebrows/prominent labels, region
  labels, drawer title) MUST render uppercase in the display face at weight 400;
  side-navigation labels, body, and label text MUST render in mixed case in the text face
  at weight 200 from tokens, matching the prototype's side-navigation mode.
- **FR-032**: The shell MUST render in the prototype's standard density; dense tokens MUST
  exist for later use but no user-facing density control is provided.

**Shared building blocks**

- **FR-033**: The shell MUST be composed from reusable branded building blocks reproducing
  the prototype's anatomy, at minimum: app shell (header + navigation + content), page
  header (eyebrow, title, optional description, optional actions), screen region (label,
  optional description, optional extra), and region state (loading, empty, error with
  retry, placeholder).

**Verification**

- **FR-034**: Unit tests MUST cover every shell behavior and UX rule in this spec (rendered
  navigation set and order, selection rules, sub-screen selection, not-found, page titles,
  tier calculation at boundaries, drawer open/close/focus behavior, skip link, landmarks,
  reduced motion, token parity with the constitution, and absence of hardcoded style
  values), and MUST reach 100% line, branch, function, and statement coverage for code
  added by this spec.
- **FR-035**: End-to-end tests MUST load every in-scope screen at each viewport in the
  matrix (360×740, 390×844, 768×1024, 1024×768, 1366×768, 1920×1080, 2560×1440) and assert
  no horizontal document overflow, correct navigation mode per tier, visible and operable
  header/navigation access/page header, and visible keyboard focus.
- **FR-036**: End-to-end screenshot comparisons MUST compare each in-scope screen at each
  viewport against committed baselines captured from the prototype with the same bundled
  font, masking data-bearing regions, with a maximum pixel-difference ratio of 1%; baselines
  change only with human approval.
- **FR-037**: All automated tests MUST use deterministic fixtures and MUST NOT depend on a
  live data environment.

### Key Entities _(include if feature involves data)_

This feature reads no business data. The conceptual items it introduces are:

- **Design token set**: The complete, named set of brand constants (typography, color,
  spacing, radius, shadow, sizes, breakpoints, motion, layering), with standard and dense
  type-scale variants. Single source for all styling.
- **Navigation destination**: An in-scope screen exposed in the side navigation — label,
  icon, address, and order.
- **Screen**: A route-level view with its address, page-header copy, owning navigation
  destination (itself, or Doors for sub-screens), and placeholder content region.
- **Layout tier**: Compact, standard, or wide, determined by viewport width, which selects
  navigation mode, spacing, and touch-target sizes.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of in-scope screens (6 of 6) are reachable via navigation or a direct
  address, show the correct page header, and keep the correct navigation entry selected.
- **SC-002**: 0 navigation entries, links, or addresses render content for any of the 5
  excluded screens.
- **SC-003**: For every in-scope screen at all 7 viewports (42 combinations), there is no
  horizontal document scrolling and the navigation mode matches the expected tier.
- **SC-004**: Screenshot comparisons of shell chrome, typography, and color against the
  prototype differ by no more than 1% of pixels for all 42 screen × viewport combinations.
- **SC-005**: 100% of brand constants used by the shell and screens come from the single
  token set; an automated scan finds 0 hardcoded color, font-size, font-family, or
  spacing values outside it.
- **SC-006**: Every canonical brand token value in the constitution is matched exactly
  (100% parity), verified automatically.
- **SC-007**: A keyboard-only user can reach every shell control and every in-scope screen
  with visible focus on every step, and automated accessibility checks report 0 WCAG 2.1 AA
  violations on the shell for every in-scope screen.
- **SC-008**: Unit tests for this feature pass with 100% line, branch, function, and
  statement coverage; end-to-end tests pass with no manual steps and no live data source.
- **SC-009**: The shell's first meaningful render completes within 3 seconds inside the
  hosting environment on a desktop connection.
- **SC-010**: In a side-by-side review with the prototype, reviewers confirm the shell
  "looks and feels like the prototype" (brand, typography, navigation, spacing, motion) for
  every in-scope screen at a compact, standard, and wide viewport.

## Assumptions

- The constitution's in-scope / excluded screen lists are the "flagged" screens referred to
  in the request: Explorer, Exports, Activity, Data sources, and Parking lot are not built.
- Door detail and Mass update are sub-screens of Doors (as in the prototype) and have no
  navigation entry; Manage tiers is part of Tier assortments and is delivered with that
  screen's content spec, not here.
- The prototype's "Viewing as" persona switcher and density toggle are prototype demo
  controls, not product features; header actions such as the "unsaved changes" chip belong
  to the Tier assortments spec.
- Screen content (Overview tasks, KPIs, charts; Doors grid; Door detail; Mass update
  workflow; Tier assortments compose view; Exceptions grid) is delivered by later specs; this
  spec provides only page headers and labeled placeholder regions.
- Where the prototype's page-header description, actions, or title (Door detail shows the
  door's name) are generated from live data, they are omitted or replaced by the generic
  title until the screen's content spec delivers them.
- The eyebrow for Door detail is data-driven in the prototype; "Strategy" is used as the
  static default, consistent with its sibling screens.
- The token file location and name (`src/theme/token.ts`), the use of Playwright for
  end-to-end tests, and 100% unit coverage are fixed by the user request and the
  constitution and are treated as constraints, not design choices.
- Only the Regular face of the licensed font exists; weight 200 renders as Regular.
- The standard density is the default and only density shown to users in this spec.

## Clarifications

### Session 2026-10-26 (plan-phase corrections from prototype source)

- Side-navigation labels follow the prototype's side mode (`cds-side-label`: text face,
  weight 200, mixed case); only the horizontal-navigation variant uses uppercase display
  labels, and that variant is not used. → US1 scenario 2 and FR-031 updated.
- The prototype header in side mode includes a rail collapse/expand toggle (240 px ↔
  64 px). → US3 scenario 2 and FR-017 updated.

## Data Gaps

None. This feature reads no Dataverse data. The constitution's known in-scope gaps
(Retailer identification field, SKU Type availability) do not affect the shell and remain
open for the screen specs that need them.

## Verification & Known Limitations

_To be completed during and after implementation._ Known limitations at specification time:

- **Single font face**: only `ABChanel Corpo Regular` is licensed; weight 200 (text) and
  400 (display) render identically, and bold/italic are not available.
- **Placeholder content**: every in-scope screen shows a labeled placeholder region until
  its content spec is delivered.
- **No density toggle**: dense tokens exist but are not user-selectable.
- **Screenshot baselines**: prototype baselines mask data-bearing regions, so they verify
  chrome, typography, and color but not screen content.
- **Prototype demo controls** (persona switcher, density toggle) intentionally not
  reproduced.
