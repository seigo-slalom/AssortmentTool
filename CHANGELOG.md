# Changelog

All notable changes to this **template** are documented here (not changes to apps built
from it). Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-08-14

### Added

- Initial Slalom Power Platform Code App SDD starter template, derived from Microsoft's
  Power Apps Code Apps sample and GitHub Spec Kit.
- `.specify/memory/constitution.md` with 8 core principles and a "Project-Specific
  Configuration" placeholder block, scoped exclusively to code-app development.
- `.specify/memory/power-platform-code-apps.md` and `.specify/memory/frontend-standards.md`
  knowledge docs.
- Additive customizations to `plan-template.md` / `tasks-template.md` for Power Platform
  context.
- `.github/instructions/power-apps-code-app.instructions.md` and
  `.github/chatmodes/code-app-architect.chatmode.md`.
- Placeholder app (React 19 + Vite 7 + TypeScript, Ant Design v5 + ProComponents,
  TanStack Query, React Router v7, React Hook Form + Zod) with Vitest/Playwright/Prettier
  wired in.
- `README.md`, `docs/RUNBOOK.md`, `LICENSE`, `NOTICE`.
- Vite `manualChunks` vendor splitting and route-level `React.lazy` to keep production
  bundle chunks cache-friendly and under the default Rollup warning threshold.
- `docs/MAINTENANCE.md`, `.github/dependabot.yml` (grouped weekly updates), and this
  changelog, to support keeping the template current as Spec Kit and the UI stack evolve.
- `.github/copilot-instructions.md` (repo-wide, always-applied) plus a matching
  constitution gate and chatmode note, so build/lint/test/format commands only run for
  changes to buildable code — never for Markdown-only edits during
  `/speckit.specify`/`/speckit.plan`/`/speckit.tasks`/`/speckit.constitution`.
