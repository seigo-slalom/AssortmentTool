# Power Platform Code App Starter Kit

## Presentation Outline

### Audience

Power Platform developers, makers, platform engineers, and technical leads who are evaluating code apps and Spec-Driven Development (SDD).

### Presentation Goal

Explain why the starter kit exists, what it provides, how it was assembled, and how a team can adopt and customize it for a real Power Platform code app.

---

## Slide 1: Title and Agenda

**Title:** Power Platform Code App SDD Starter Kit

**Agenda:**

1. Starter kit theory and philosophy
2. Core components and their purpose
3. How the repository was created and what sources it uses
4. How a team adopts and customizes the template

---

# 1. Starter Kit Theory and Philosophy

## Slide 2: The Problem We Are Solving

Power Platform code apps provide a path to build custom React and TypeScript experiences while still using Power Platform for authentication, connectors, Dataverse, and other platform capabilities.

Without a shared starting point, every team must repeatedly decide:

- Which frontend framework and build tools to use
- How to access Power Platform data correctly
- How to structure components, hooks, pages, and services
- How to handle loading, error, and empty states
- How to test, lint, format, and build the application
- How to guide AI-assisted development
- How to turn a business idea into an implementable feature

**Starter kit response:** provide a reusable, opinionated foundation with documented standards, Power Platform guardrails, and an SDD workflow.

## Slide 3: The Core Philosophy

### Connector-first data access

- Code apps run in a sandbox where direct outbound HTTP calls are not supported.
- Data access must use Power Platform connectors and generated typed services.
- ESLint rules help prevent unsupported patterns such as `fetch`, `XMLHttpRequest`, and `axios`.
- This keeps the application aligned with platform authentication, DLP, and connector behavior.

### Spec-driven delivery

Features move through a deliberate lifecycle:

```text
constitution -> specify -> plan -> tasks -> implement
```

- The constitution defines project principles and constraints.
- The specification defines user needs and acceptance criteria.
- The plan establishes architecture and technical decisions.
- Tasks make the work actionable and dependency ordered.
- Implementation executes the approved work.
- Human review gates remain between phases; AI proposes, people approve.

### The frontend is a public surface

- Everything shipped to the browser can be inspected by end users.
- Secrets, tokens, connection strings, and sensitive configuration must never be embedded in the client bundle.
- Every data interaction should handle loading, error, and empty states.
- The UI should meet the project's accessibility target, with WCAG 2.1 AA as the default.

## Slide 4: Code App Versus Traditional Full-Stack Development

| Concern                | Traditional full-stack application          | Power Platform code app                                                                           |
| ---------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Frontend               | Owned by the development team               | Owned by the development team                                                                     |
| Backend                | Team builds and operates APIs               | Power Platform provides the backend capabilities                                                  |
| Data                   | Team operates a database or API layer       | Dataverse and connectors provide access to data and services                                      |
| Authentication         | Team implements and maintains auth flows    | Power Platform and connectors provide the platform path                                           |
| Runtime infrastructure | Team deploys and operates services          | Code app bundle is deployed to Power Platform                                                     |
| ALM                    | Team owns application and backend promotion | This repo pushes to an environment; broader solution ALM remains an organizational responsibility |

**Key message:** this is not a conventional full-stack repo. It is primarily a client-side application that uses Power Platform as its managed backend and integration layer.

---

# 2. Starter Kit Repo Core Components

## Slide 5: Architecture at a Glance

```text
+--------------------------------------------------+
| React application                                |
| React, TypeScript, Ant Design, routing, forms    |
+--------------------------------------------------+
| Application state and data orchestration         |
| TanStack Query, hooks, validation, providers     |
+--------------------------------------------------+
| Power Platform data access                       |
| Generated models and services in src/generated/  |
+--------------------------------------------------+
| Power Platform                                  |
| Dataverse, connectors, flows, identity, hosting  |
+--------------------------------------------------+
```

The repository owns the code app codebase. Power Platform components such as Dataverse tables, connections, flows, and environments are created and governed outside this repository.

## Slide 6: Application and Build Foundation

| Component                 | What it does                                          | Why it matters                                                  |
| ------------------------- | ----------------------------------------------------- | --------------------------------------------------------------- |
| React                     | Builds the component-based UI                         | Enables custom experiences beyond standard Canvas controls      |
| TypeScript in strict mode | Adds static type checking                             | Finds incorrect data and API usage before runtime               |
| Vite                      | Runs local development and creates production bundles | Provides fast feedback and optimized builds                     |
| Power Apps Vite plugin    | Integrates the app build with code app requirements   | Connects the standard frontend toolchain to Power Platform      |
| `PowerProvider`           | Manages Power Apps SDK initialization                 | Prevents feature UI from rendering before host context is ready |

## Slide 7: Data, UI, and State Standards

- **Generated services:** `pa app add data-source` creates typed models and services under `src/generated/`.
- **TanStack Query:** wraps generated services for caching, loading, refetching, and mutations.
- **Ant Design:** provides the default enterprise UI component library.
- **React Router:** handles route-level pages and navigation.
- **React Hook Form and Zod:** provide form state management and validation.
- **Folder conventions:** `components/`, `hooks/`, `pages/`, `lib/`, and `generated/` make the codebase predictable.

The objective is not to prescribe every implementation detail. It is to make the common path clear and consistent.

## Slide 8: Quality and Developer Experience Components

### ESLint

- Detects JavaScript, TypeScript, and React issues.
- Enforces React Hooks and refresh rules.
- Adds code app-specific restrictions around direct network access.

### Prettier

- Applies consistent formatting automatically.
- Removes formatting debates from code review.
- Runs through `npm run format` and `npm run format:check`.

### Vitest and Testing Library

- Test components, hooks, validation, and business logic quickly.
- Runs in a Node and JSDOM-based environment.
- Best for many focused tests and fast developer feedback.

### Playwright

- Runs browser-based end-to-end tests.
- Validates critical user paths and application shell behavior.
- More expensive and more environment-sensitive than unit tests.

### TypeScript build

- `npm run build` performs the TypeScript build and Vite production build.
- A clean build is required before `pa app push`.

## Slide 9: Governance, Maintenance, and Automation

- **Spec Kit:** provides the SDD lifecycle and reusable skills.
- **Constitution:** captures non-negotiable project principles and project-specific configuration.
- **Copilot instructions:** provide repository-wide rules for AI-assisted development.
- **Custom chat mode:** provides Power Platform-specific architecture guidance.
- **Dependabot:** opens grouped weekly updates for npm packages and GitHub Actions.
- **`.nvmrc`:** communicates the required Node.js major version.
- **MIT license:** allows reuse and modification while preserving the license and copyright notice.
- **Maintenance guide:** defines version tracking, quarterly review, and upgrade practices.

### GitHub Actions status

The starter does not include an active GitHub Actions workflow by default. CI and deployment workflows are intentionally left for the adopting team because they depend on organizational policies, environments, secrets, approvals, and ALM strategy.

A team can add workflows for pull request validation, dependency checks, builds, and deployment after those decisions are clear.

---

# 3. How the Repo Was Created and Source Material

## Slide 10: Sources and Starting Points

The starter kit combines several sources and design inputs:

1. **Microsoft Power Apps Code Apps guidance and samples**
   - React, Vite, TypeScript, and Power Apps SDK foundation
   - Power Apps CLI workflow
   - Code app hosting and Local Play concepts
   - Connector and generated-service patterns

2. **GitHub Spec Kit**
   - Spec-Driven Development lifecycle
   - Constitution, specification, plan, tasks, and implementation artifacts
   - Reusable agent skills and templates

3. **Power Platform connector documentation**
   - Connector capabilities and limitations
   - Generated service behavior
   - Dataverse and connector-specific data modeling considerations

4. **Modern frontend engineering practices**
   - Component-based UI architecture
   - Strict TypeScript
   - Automated formatting and linting
   - Unit, component, and browser testing
   - Bundle splitting and dependency maintenance

5. **Slalom-specific engineering judgment**
   - Connector-first and generated-code guardrails
   - Security and accessibility defaults
   - Explicit scope boundaries between the code app and Power Platform ALM
   - Human review gates for AI-assisted development

## Slide 11: What Was Added for This Starter

The repository adds Power Platform context around the general tools and frameworks:

- An eight-principle constitution tailored to code apps
- A project-specific configuration block for each adopting team to complete
- Runtime guidance for the Power Apps CLI, connectors, generated services, and Dataverse gotchas
- Frontend standards for UI, state, routing, forms, accessibility, testing, and performance
- ESLint restrictions that turn platform constraints into local feedback
- Copilot instructions and a code-app architecture chat mode
- Power Platform additions to the Spec Kit plan and task templates
- A clearly labeled placeholder application
- A runbook for adoption and deployment
- A maintenance guide and changelog for the template itself

## Slide 12: Design Decisions and Boundaries

### What this repository owns

- React and TypeScript source code
- Frontend build and test configuration
- Generated connector service consumption
- Local developer workflow
- Feature specifications, plans, tasks, and implementation guidance

### What this repository does not own

- Dataverse table creation
- Power Platform connections and connection references
- Flows and other maker portal artifacts
- Environment creation and administration
- Production solution promotion and broader Power Platform ALM

This boundary keeps the template focused and makes ownership explicit.

---

# 4. Adoption and Customization

## Slide 13: Adoption Workflow at a Glance

```text
Use the template
        |
        v
Install dependencies and initialize the environment
        |
        v
Complete the project constitution
        |
        v
Create Power Platform components in the maker portal
        |
        v
Generate typed data-source services
        |
        v
Specify -> plan -> task -> implement the first feature
        |
        v
Build, validate, review, and push to the target environment
```

## Slide 14: Phase 1 - Create and Initialize the Repository

1. Create a new repository from the GitHub template or clone the starter.
2. Install Node.js 22+ and Git.
3. Install dependencies:

```bash
npm install
```

4. Initialize the code app and associate the local project with a Power Platform environment:

```bash
npx power-apps init
```

5. Sign in and select the target environment.
6. Confirm that `power.config.json` is created locally and remains Git-ignored.
7. Run the placeholder locally and confirm the development setup works:

```bash
npm run dev
```

The placeholder may show a host-unavailable state outside Power Apps. That is expected; it confirms the app handles the missing host lifecycle explicitly.

## Slide 15: Phase 2 - Establish Project Context

Run the constitution workflow in Copilot:

```text
/speckit.constitution
```

Complete the project-specific configuration:

- App name and business purpose
- Dev, test, and production environments
- Data sources and connectors
- Owning team and reviewers
- Performance targets
- Accessibility target
- Security, compliance, and DLP expectations
- Licensing assumptions
- UI library confirmation or approved alternative

This step turns the generic starter into an accountable project repository.

## Slide 16: Phase 3 - Create and Wire Power Platform Data Sources

Create the required Power Platform components through the maker portal or admin center:

- Dataverse tables, columns, choices, and lookups
- Connections and connection references
- Custom or standard connectors
- Power Automate flows where appropriate

Then generate typed services in the local repository:

```bash
npx power-apps connection list
npx power-apps add data-source --connector <connector> -c <connection-id>
```

Generated output normally includes:

- `src/generated/models/` for typed interfaces
- `src/generated/services/` for connector operations

Do not hand-edit generated code unless a documented connector workaround is required. Do not replace generated services with direct HTTP calls.

## Slide 17: Phase 4 - Deliver Features with Spec Kit

Use the SDD sequence:

```text
/speckit.specify
/speckit.plan
/speckit.tasks
/speckit.implement
```

At each phase:

- Describe the user problem and acceptance criteria.
- Identify connector and data requirements.
- Review architecture and non-functional requirements.
- Confirm task order and scope.
- Implement with generated services and repository standards.
- Add focused unit tests and relevant browser tests.
- Review the changes before moving to the next phase.

## Slide 18: Validate and Deploy

Typical local checks include:

```bash
npm run format:check
npm run lint
npm test
npm run test:e2e
npm run build
```

Before deployment:

1. Resolve all build and lint issues.
2. Review generated service usage and security boundaries.
3. Confirm loading, error, empty, and accessibility states.
4. Push the built code app to the initialized environment:

```bash
npx power-apps push
```

Promotion to UAT or production should follow the team's existing Power Platform solution and ALM process.

## Slide 19: Customization Options

Teams can adapt the starter while preserving its core principles.

### GitHub Actions and CI/CD

- Add pull request workflows for install, lint, format check, unit tests, and build.
- Add Playwright jobs when the test environment and browser dependencies are available.
- Add deployment jobs only after deciding how environments, secrets, approvals, and Power Platform ALM will work.
- Keep environment-specific configuration out of source control.

### UI and application architecture

- Confirm Ant Design or choose an approved accessible alternative.
- Add ProComponents or other libraries only when a feature justifies the dependency.
- Preserve route-level lazy loading and review bundle size after adding large packages.

### Team-specific agent guidance

- Extend Copilot instructions with domain, security, naming, or review rules.
- Add chat modes or skills for specialized architecture and operational tasks.
- Keep platform constraints and security requirements explicit.

### Testing strategy

- Add unit tests for logic, components, and hooks.
- Add a small number of high-value Playwright workflows.
- Use manual validation or an environment-backed test strategy for Power Platform host behavior and real connector interactions.

## Slide 20: Success Criteria and Next Steps

### A successful adoption means the team can:

- Explain the code app and Power Platform ownership boundary.
- Use generated connector services instead of direct HTTP calls.
- Complete the project constitution with real environment and governance details.
- Move a feature through the SDD lifecycle with human review gates.
- Run clean formatting, lint, tests, and production builds.
- Push a working code app to a development environment.
- Maintain the resulting repository with appropriate CI/CD and ALM practices.

### Suggested pilot

Start with one small, real feature that includes:

- One Power Platform data source
- One page or workflow
- One form or mutation
- Loading, error, and empty states
- A focused unit test set
- One meaningful browser smoke test

Use the pilot to validate the template, the SDD workflow, and the team's Power Platform ALM expectations before standardizing more broadly.

---

## Appendix: Useful References

### Repository references

- `README.md` - overview, prerequisites, and quick start
- `docs/RUNBOOK.md` - adoption and operational workflow
- `docs/MAINTENANCE.md` - template maintenance and upgrade guidance
- `.specify/memory/constitution.md` - project principles and governance
- `.specify/memory/power-platform-code-apps.md` - Power Apps CLI and connector guidance
- `.specify/memory/frontend-standards.md` - frontend stack and coding standards
- `.github/copilot-instructions.md` - repository-wide Copilot guidance
- `.github/instructions/power-apps-code-app.instructions.md` - Power Platform code rules

### External references

- Microsoft Power Apps Code Apps documentation: https://learn.microsoft.com/power-apps/developer/code-apps/
- Power Platform connector reference: https://learn.microsoft.com/connectors/connector-reference/
- GitHub Spec Kit: https://github.com/github/spec-kit
- Ant Design: https://ant.design/
- TanStack Query: https://tanstack.com/query/
- Playwright: https://playwright.dev/
- Vitest: https://vitest.dev/
