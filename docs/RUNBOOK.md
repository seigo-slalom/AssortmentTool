# Runbook — Power Platform Code App

Operational guide for taking a code app from a fresh clone of this template to a published
app. This complements the [README](../README.md), the
[constitution](../.specify/memory/constitution.md), and
[power-platform-code-apps.md](../.specify/memory/power-platform-code-apps.md).

> Reminder: this repository builds the **code app codebase only**. Dataverse tables,
> connectors, flows, and connection references are created in the Power Platform maker
> portal / admin center and then wired into the app with `pa app add data-source`.

## 0. Prerequisites (one-time)

- [ ] Node.js 22.22.2+ or 24.15+ (LTS) and Git installed (`node --version`, `git --version`).
- [ ] Access to a Power Platform environment.
- [ ] **Code apps enabled** on that environment: Power Platform admin center → **Manage →
      Environments** → your environment → **Settings → Product → Features** → enable
      **Power Apps code apps** → **Save**. (Admin-only.)
- [ ] **Power Apps Premium** licensing for end users.
- [ ] An AI coding agent with Spec Kit (e.g., GitHub Copilot in VS Code).

## 1. Create the project

- GitHub: **Use this template → Create a new repository**, then `git clone` it, **or**
- `npx degit <your-org>/<this-template-repo> my-code-app && cd my-code-app`

## 2. Install and initialize

```bash
npm ci                 # exact locked deps + local Power Apps CLI
npx power-apps init    # sign in, pick environment → writes power.config.json
```

- `power.config.json` is created here. It holds the environment ID and is **Git-ignored** —
  do not commit it.
- Equivalent grouped command: `pa app init -n "<app name>" -e <environment-id>`.

## 3. Establish project principles (SDD)

In your agent: `/speckit.constitution`. Complete the **Project-Specific Configuration**
(app name, purpose, environments, data sources, owner/reviewers, NFRs, security/compliance,
licensing) and **confirm or change the default UI library** (Ant Design v5 + ProComponents).

## 4. Verify the placeholder runs

```bash
npm run dev
```

- Open the **Local Play URL** printed by the plugin, using the **same browser profile** as
  your Power Platform tenant.
- The placeholder screen renders with an empty table. Full data appears only after you
  connect a data source (next step). Outside the Power Apps host, `PowerProvider` shows a
  "host unavailable" message after a short timeout — this is expected on plain `localhost`.

## 5. Create Power Platform components (outside this repo)

In the **maker portal** create what the feature needs: Dataverse tables/columns/choices,
connections, custom connectors, flows, connection references. This is intentionally **not**
done from this repository.

## 6. Connect data (generate typed services)

```bash
npx power-apps connection list                                  # find connection IDs
npx power-apps add data-source --connector <api> -c <conn-id>   # generate services
```

- Output lands in `src/generated/models/*` and `src/generated/services/*`.
- Use the generated services for all data access. **Never** use `fetch`/`axios`/Graph/Azure
  REST — those fail in the code-app sandbox.
- Tabular connectors (SharePoint/Excel) also need `--dataset` and `--table`.

## 7. Build the feature via SDD

`/speckit.specify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`, approving at
each gate. Replace the placeholder screen and `src/lib/placeholderService.ts` with real
features backed by generated services. Consult the `code-app-architect` chat mode for
architecture, connector selection, and troubleshooting.

> **Lightweight path for small changes**: the full ceremony is for new features,
> architecture changes, or anything touching a data source/connector. For a trivial
> change — a typo, a copy tweak, a small bug fix with no behavior or data-source impact —
> it's fine to skip straight to a small PR instead of running `/speckit.specify` through
> `/speckit.tasks`.

## 8. Validate

```bash
npm run lint
npm test
npm run build     # must be clean (strict TypeScript) before publishing
```

## 9. Publish

```bash
npx power-apps push   # deploys the built app; returns a Power Apps URL
```

Share and manage the app in [make.powerapps.com](https://make.powerapps.com).

> **ALM scope boundary**: this repo's responsibility ends at `pa app push` to a single
> Power Platform environment (typically dev), run by a human developer. Promoting the
> app into UAT/PROD — and any solution-level ALM covering the Dataverse tables, flows,
> and connection references this app depends on — is owned by your Power Platform
> team's existing deployment process and is out of scope for this repository.

## Troubleshooting

| Symptom                                       | Likely cause / fix                                                                                                                             |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser blocks localhost during `npm run dev` | Chrome/Edge block public→local requests. Grant permission; for iframes add `allow="local-network-access"`.                                     |
| App stuck "Connecting to Power Platform…"     | Opened outside the Power Apps host. Use the **Local Play URL** in your tenant browser profile.                                                 |
| `add data-source` rejected                    | Node.js too old — upgrade (`nvm install` then `nvm use`, reads `.nvmrc`).                                                                      |
| `npm ci` fails with `EBADENGINE`              | Node.js below the `engines` floor in `package.json` (22.22.2 / 24.15). Upgrade Node; don't remove `engine-strict`.                             |
| `npm install` fails with `ERESOLVE`           | Incompatible peer versions. Use `npm ci` on fresh clones; never add `--legacy-peer-deps` — fix the versions instead.                           |
| Auth prompt loop                              | Sign in with the account for the target environment; `npx power-apps auth logout` then retry.                                                  |
| Build fails on unused imports (TS6133)        | Strict mode — remove unused imports/vars.                                                                                                      |
| Connector data won't load at runtime          | A direct HTTP call was used, or the connector/connection isn't provisioned. Use generated services; verify the connection in the maker portal. |
| Wrong environment                             | Re-run `npx power-apps init -e <env-id>`; confirm `power.config.json`.                                                                         |
| Azure DevOps HttpRequest errors               | Apply the workaround: rename `parameters` → `body` in the three generated files.                                                               |

## Known platform limitations

- No Power Platform Git integration for code apps.
- Not supported in Power Apps for Windows.
- No SAS IP restriction — use **Conditional Access** (block by location) for IP control.
- No `PowerBIIntegration` function yet — embed via the Power Apps visual instead.
- No SharePoint forms integration.
