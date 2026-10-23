# Power Platform Code Apps — Runtime Guidance

Distilled reference for building **Power Platform code apps** in this repository. This
document is referenced by the constitution and is intended to be pulled into every SDD
phase (`specify → plan → tasks → implement`). It captures the platform's nuances so
plans and code respect them.

> Scope reminder: this repository builds the **code app codebase only**. Dataverse
> tables, connectors, flows, connection references, and environments are created by
> developers via the Power Platform maker portal / admin center, then referenced here.

## What a code app is

A code app is a custom web app (React + Vite + TypeScript) that runs **inside Power
Platform**, using Microsoft Entra authentication and Power Platform connectors for data.
It is a pure client-side single-page app compiled by Vite and served from a managed
endpoint. There is no server you control at runtime — all external data flows through
connectors.

## Prerequisites

- **Node.js 22.22.2+ or 24.15+ (LTS)** and **Git** on the PATH.
- A Power Platform environment with **code apps enabled** (admin toggle in the Power
  Platform admin center → Environment → Settings → Product → Features).
- **Power Apps Premium** licensing for end users.
- The Power Apps CLI (`@microsoft/power-apps-cli`) — installed locally by `npm ci`
  from the template; no separate global install required.

## The Power Apps CLI

The CLI ships two binaries: grouped **`pa`** (preferred) and flat **`power-apps`**
(fallback). Invoke with `npx --no-install` from the project root. Authentication is
MSAL-based — a browser popup appears on the first command that needs auth.

| Task | Command |
| --- | --- |
| Initialize app + set environment (writes `power.config.json`) | `pa app init -n "<app name>" -e <environment-id>` |
| Run locally (Local Play URL) | `pa app run` |
| Build (standard npm) | `npm run build` |
| Deploy compiled app | `pa app push` |
| Add a connector data source | `pa app add data-source --connector <api> -c <connection-id>` |
| List connections (to find connection IDs) | `pa connection list` |
| List datasets for a tabular connector | `pa connector list-datasets --connector <api> -c <id>` |
| List tables in a dataset | `pa connector list-tables --connector <api> -c <id> -d <dataset>` |
| Log out | `pa auth logout` |

> The classic `pac code ...` commands are deprecated in favor of the npm CLI above.
> `npx power-apps init` is equivalent to `pa app init`.

## Standard workflow

1. `npm ci`
2. `npx power-apps init` (or `pa app init -n "<name>" -e <env-id>`) → creates
   `power.config.json`
3. Create required Power Platform components in the **maker portal** (tables, connectors,
   flows, connection references).
4. `pa app add data-source ...` to generate typed services for each data source.
5. Build features via the SDD lifecycle using the generated services.
6. `npm run build` → resolve all errors.
7. `pa app push` → returns a Power Apps URL; share via `make.powerapps.com`.

## Connector-first principle

Code apps run in a sandbox — **direct outbound HTTP does not work at runtime**. Never use
`fetch`, `axios`, Microsoft Graph SDKs, or Azure REST for data access. Choose the right
connector instead:

| App needs to… | Connector (skill) |
| --- | --- |
| Store/manage custom business data (tables, CRUD) | Dataverse (`/add-dataverse`) |
| Track work items, bugs, pipelines | Azure DevOps (`/add-azuredevops`) |
| Send/read Teams messages | Teams (`/add-teams`) |
| Read/write Excel workbook data | Excel Online (`/add-excel`) |
| Upload/download/manage files | OneDrive (`/add-onedrive`) |
| Read lists / manage SharePoint documents | SharePoint (`/add-sharepoint`) |
| Send email, read inbox, manage calendar | Office 365 Outlook (`/add-office365`) |
| Invoke a Copilot Studio agent | MCS Copilot (`/add-mcscopilot`) |
| Anything else | Generic connector (`/add-connector`) |

Browse the full list at <https://learn.microsoft.com/en-us/connectors/connector-reference/>.
If **no connector exists** for a required capability, tell the developer clearly — do not
implement a direct API call as a workaround, because it fails in production.

## Generated services

`pa app add data-source` generates typed code into `src/generated/`:

- `src/generated/models/{Name}Model.ts` — TypeScript interfaces
- `src/generated/services/{Name}Service.ts` — CRUD (and file/image) methods

Always use these generated services for data access. Do not hand-edit `src/generated/`
except for documented connector workarounds. Non-Dataverse connectors require a
**connection ID** (`-c`); find it with `pa connection list`.

## Dataverse gotchas

- **Choice/Picklist fields** store integers, not strings — use numeric constants; type
  `useState` picklist fields explicitly as `number` to avoid TS literal inference.
- **Virtual fields** (ending in `name`) cannot be selected in OData queries — convert to
  labels in code.
- **Lookup fields** expose `_field_value` (GUID, read-only) for reading; write with
  `@odata.bind`.
- **Formatted values** — request via the `Prefer: odata.include-annotations` header for
  server-side date/currency/label formatting.
- **File/Image columns** — use the generated `upload`, `downloadFile`, `downloadImage`,
  and `deleteFileOrImage` methods; never raw fetch. Models export table-prefixed union
  types (e.g., `AccountsFileColumnName`) for type-safe column references.

## Connector workarounds

- **Azure DevOps** — the HttpRequest method requires renaming `parameters` to `body` in
  three generated files.
- **SharePoint / Excel** — tabular data sources need `--dataset` and `--table` when adding.
- **Excel Online** — the body is a flat key–value object (no `{ items: ... }` wrapper).
- **Work IQ** (`shared_a365copilotchatmcp`) — stateless-tolerant MCP connector; create the
  connection with `pa connection create` (browser OAuth) and use the `McpSession` wrapper.

## Build requirements

- Always `npm run build` before `pa app push`.
- Remove unused imports (TS6133 under strict mode).
- Do not edit files in `src/generated/` unless fixing a known issue.
- Node.js 22+ is required — `add data-source` rejects older versions.

## Platform limitations

- No Power Platform Git integration for code apps.
- Not supported in Power Apps for Windows.
- No SAS IP restriction — use **Conditional Access** (block by location) for IP control.
- No `PowerBIIntegration` function yet — embed in Power BI reports via the Power Apps
  visual instead.
- No SharePoint forms integration.

## Local development note

Chrome and Edge block requests from public origins to local endpoints by default. Because
`pa app run` connects to `localhost`, you may need to grant browser permission; for
embedded scenarios add `allow="local-network-access"` to iframe tags. Open the Local Play
URL in the **same browser profile** used for your Power Platform tenant.

## References

- Code apps overview: <https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview>
- npm CLI quickstart: <https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/npm-quickstart>
- Samples & templates: <https://github.com/microsoft/PowerAppsCodeApps>
- Code Apps AI plugin (architect agent + skills): <https://github.com/microsoft/power-platform-skills/tree/main/plugins/code-apps>
