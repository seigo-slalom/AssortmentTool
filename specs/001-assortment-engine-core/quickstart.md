# Quickstart: Validating the Assortment Engine Core

Run these after `/speckit-implement` (not during planning).

## Prerequisites

- Node 22.22.2+ / 24.15+; `npm ci` completed (installs `@vitest/coverage-v8` and
  `fast-check` once added to `package.json`).
- No Power Platform environment is needed; adapter tests mock the generated services.

## 1. Unit tests and coverage gate (US1, US2, US4, US5)

```powershell
npm run test:coverage
```

Expect: all tests pass; lines, branches, functions, and statements all 100%; the run exits
non-zero if any metric is below 100%. Temporarily adding an untested branch to a file in
`src/features/engine/core/` must make it fail (SC-007).

## 2. Rule scenarios (US1, US2)

Covered by `src/features/engine/core/*.test.ts`: missing tier, inactive SKUs, disabled
tier rules, near-miss product lines (case, leading/trailing space), Door-over-Retailer
precedence, same-level Remove-wins, retailer-code near misses, exceptions on unavailable
SKUs, malformed exceptions. Map each to spec acceptance scenarios (SC-001).

## 3. Equivalence with the reference engine (SC-005)

Property tests in `engine.equivalence.test.ts` compare the optimized engine against
`referenceEngine.testutil.ts` on generated datasets (results, counts, explanations).

## 4. Performance (US3, SC-002–SC-004)

```powershell
npx vitest bench --run src/features/engine/core/engine.bench.ts
```

Expect on the medium dataset: single-door derivation ≤ 200 ms (typically ≪ 5 ms), index
build ≤ 1 s, all-door counts ≤ 100 ms.

## 5. Loading (US4, SC-008)

Adapter tests assert: only needed `select` columns, server filters present, all
`skipToken` pages followed, all-or-nothing on failure, absent optional fields mapped to
`undefined`, and ~11 requests for the medium dataset.

## 6. Build and lint gates

```powershell
npm run lint
npm run build
```

Expect: clean; lint fails if `core/` imports React, generated code, or adapters.
