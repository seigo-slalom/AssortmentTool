# Repository-wide Copilot instructions

This is a **Power Platform code app** SDD starter template. These instructions always
apply, regardless of which file is being edited.

## Command execution discipline

Only run verification commands (`npm run build`, `npm run lint`, `npm test`,
`npm run test:e2e`, `npm run format` / `format:check`) or start the dev server when the
change actually touches **buildable/runtime code**: `src/**`, `vite.config.ts`,
`package.json`, `package-lock.json`, `tsconfig*.json`, or test files.

**Do NOT run those commands** after changes limited to Markdown or non-code config, e.g.:

- Spec Kit artifacts (`spec.md`, `plan.md`, `tasks.md`, `research.md`, checklists,
  `.specify/memory/*.md`, `.specify/templates/*.md`)
- `.github/instructions/*.md`, `.github/chatmodes/*.md`, `.github/skills/**`
- `README.md`, `docs/**`, `CHANGELOG.md`, `LICENSE`, `NOTICE`, `.github/dependabot.yml`

This matters most during the SDD lifecycle: `/speckit.constitution`, `/speckit.specify`,
`/speckit.plan`, and `/speckit.tasks` only produce or edit planning documents — they never
warrant a build/lint/test pass. Verification is appropriate during/after
`/speckit.implement`, and only for the code files actually changed. If unsure whether an
edit qualifies, check which files changed against the list above before deciding to run a
command.

See `.specify/memory/constitution.md` for full project principles and quality gates.
