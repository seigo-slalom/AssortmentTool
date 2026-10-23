# Maintaining this template

This document is for people who maintain the **Slalom Power Platform Code App Starter**
template itself (this repo, upstream of every project cloned from it). If you're building
an app _from_ this template, see [RUNBOOK.md](RUNBOOK.md) instead.

## Last verified against

| Component                                                 | Version | Verified   |
| --------------------------------------------------------- | ------- | ---------- |
| GitHub Spec Kit                                           | 0.16.4  | 2026-08-14 |
| Ant Design                                                | 5.28.x  | 2026-08-14 |
| ProComponents (optional add-on, not installed by default) | 2.8.x   | 2026-08-14 |
| `@microsoft/power-apps` SDK                               | 1.2.5   | 2026-08-14 |
| `@microsoft/power-apps-vite`                              | 1.0.2   | 2026-08-14 |
| Node.js                                                   | 22+     | 2026-08-14 |

Update this table whenever you complete one of the procedures below, so anyone cloning the
template can see its freshness at a glance without archaeology.

## Review cadence

Do a light-touch pass **quarterly** (or when you notice a specific breakage):

1. `npm outdated` — note any major-version bumps available.
2. Check the [Spec Kit releases](https://github.com/github/spec-kit/releases) for a newer
   version than the one in `.specify/integrations/copilot.manifest.json`.
3. Check the Ant Design / ProComponents changelogs for breaking changes.
4. Skim the [Power Apps Code Apps docs](https://learn.microsoft.com/power-apps/developer/code-apps/overview)
   for new CLI commands, connector support, or platform limitations.
5. Run `npm run build && npm run lint && npm test && npm run format:check` on a clean
   clone to confirm the baseline still passes.
6. Update the "Last verified against" table above and add a `CHANGELOG.md` entry.

This isn't meant to be a heavyweight process — most passes should take under an hour and
result in either "nothing to do" or a small, isolated PR.

## Upgrading GitHub Spec Kit

Spec Kit's skill files (`.github/skills/speckit-*/SKILL.md`) are checksum-tracked in
`.specify/integrations/copilot.manifest.json` and are **never hand-edited** in this repo —
all Power Platform domain knowledge is injected via the constitution
(`.specify/memory/constitution.md`), the referenced memory docs
(`.specify/memory/power-platform-code-apps.md`, `.specify/memory/frontend-standards.md`),
and the plan/tasks templates. This keeps upgrades low-risk:

1. In a scratch directory, run the Spec Kit installer/upgrade flow to fetch the latest
   `.github/skills/*` and `.specify/templates/*`.
2. Diff those files against this repo's copies.
3. If upstream `SKILL.md` files changed, replace them as-is (do not merge custom content
   into them — they're meant to stay pristine).
4. If `.specify/templates/plan-template.md` or `tasks-template.md` changed upstream,
   re-apply this repo's additive customizations (the "Power Platform Code App Context"
   section and the path-convention/guidance blocks) on top of the new upstream version —
   diff carefully, since these are the two template files we deliberately customize.
5. Update the manifest version and the "Last verified against" table.
6. Run a sample `/speckit.constitution` → `/speckit.specify` → `/speckit.plan` →
   `/speckit.tasks` cycle on a throwaway feature to confirm the customizations still
   surface correctly.

## Bumping the UI/standards stack

- **Ant Design is the only default UI dependency.** ProComponents
  (`@ant-design/pro-components`) is an optional add-on, not installed by default — if a
  downstream project adds it, keep it in lockstep with `antd`/`@ant-design/icons`
  versions and re-check compatibility after any bump.
- After a major-version bump, manually smoke-test the placeholder pages (theme tokens,
  form components, and table rendering are the most common breaking-change surfaces) —
  automated tests won't catch visual/theming regressions.
- Re-run `npm run build` and check the chunk output; if a new dependency meaningfully
  grows the vendor bundle, add it to `manualChunks` in [vite.config.ts](../vite.config.ts)
  (see the "Performance" section of
  [frontend-standards.md](../.specify/memory/frontend-standards.md)).
- TanStack Query, React Router, React Hook Form, Zod, Vitest, and Playwright are lower-risk
  to bump independently — standard `npm outdated` / semver-minor hygiene applies.

## Automated dependency updates

`.github/dependabot.yml` opens grouped PRs weekly:

- `antd`, `@ant-design/icons`, and `@ant-design/pro-components` are grouped into a single
  PR (they must stay compatible with each other).
- All other npm dependencies are grouped into a second PR.
- GitHub Actions versions (if any are added later) get their own group.

Spec Kit is **not** an npm dependency, so Dependabot won't catch its updates — that's why
the manual quarterly check above exists.

## Recording changes

Add an entry to [CHANGELOG.md](../CHANGELOG.md) (Keep a Changelog format) for any change
that affects downstream consumers: dependency bumps, constitution/template edits,
instruction/chatmode changes, or new placeholder scaffolding. Teams that already cloned the
template can read the changelog to decide whether to selectively re-pull a change.
