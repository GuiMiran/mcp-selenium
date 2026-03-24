# Demo Store Traceability Matrix

## Scope

This matrix links the GUIDO intent layer for the demo store slice to its executable assets, validation status, and current delivery state.

## Traceability matrix

| ID | Intent | Source of truth | Data source | Executable asset | UI artifact | Tags | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| DS-001 | Reject invalid credentials | `specs/demo-store/demo-store.feature` scenario `Invalid credentials are rejected` | `specs/demo-store/demo-store.data.json` `invalidUser` | `test/demo-store.test.mjs` test `shows an error for invalid login` | `test/fixtures/demo-store.html` login form + `#login-error` | `@smoke`, `@regression`, `@e2e`, `@acceptance`, `@guido:L2` | Implemented | Verifies business outcome, not just tool success |
| DS-002 | Complete purchase flow from login to confirmation | `specs/demo-store/demo-store.feature` scenario `Successful purchase from login to confirmation` | `specs/demo-store/demo-store.data.json` `validUser`, `checkout`, `products` | `test/demo-store.test.mjs` test `completes the full purchase flow on the local demo page` | `test/fixtures/demo-store.html` inventory, cart, checkout, overview, confirmation | `@smoke`, `@regression`, `@e2e`, `@acceptance`, `@guido:L2` | Implemented | Covers login, add to cart, checkout, overview, finish |
| DS-003 | Preserve selector-healing readiness in the demo UI | `specs/demo-store/demo-store.context.md` selector strategy guidance | N/A | Future GUIDO engine usage | `test/fixtures/demo-store.html` stable ids, `data-testid`, `aria-label` | `@guido:L2` | Ready for expansion | Demo page includes selector metadata for future healing tests |
| DS-004 | Publish execution/status trace for the demo slice | This file | N/A | Manual review + CI handoff | N/A | `@guido:L2` | Implemented | This document acts as traceability matrix plus status log |

## Asset inventory

| Layer | Asset | Purpose |
|---|---|---|
| Intent | `specs/demo-store/demo-store.feature` | Business scenarios and acceptance intent |
| Intent | `specs/demo-store/demo-store.context.md` | Scope, risk, selector strategy, governance tags |
| Intent | `specs/demo-store/demo-store.data.json` | Test data for valid and invalid flows |
| Execution | `test/demo-store.test.mjs` | MCP-based end-to-end automation |
| Execution | `test/fixtures/demo-store.html` | Portable local demo application under test |
| Governance | `README.md` GUIDO taxonomy section | Shared tagging and execution conventions |
| Platform | `.github/workflows/build-and-test-js.yml` | JS test automation in CI |
| Platform | `.github/workflows/build-and-test-guido-engine.yml` | GUIDO engine bootstrap/build validation in CI |

## Status log

| Seq | Status | Area | Detail |
|---|---|---|---|
| 001 | Done | Strategy | GUIDO Stack strategy, pipeline agéntica, and test taxonomy were formalized in the session plan |
| 002 | Done | Demo automation | A portable demo page and MCP end-to-end test were added for the demo store slice |
| 003 | Done | Intent | Feature, context, and data artifacts were added under `specs/demo-store/` |
| 004 | Done | CI | Base workflows for JS and GUIDO engine validation were added |
| 005 | Done | Bootstrap | `guido-engine-bootstrap.js` was corrected for ES Module compatibility |
| 006 | Done | Build fix | The generated `SpectraTraceWriter.cs` escaping bug was fixed in both bootstrap templates |
| 007 | Done | Engine behavior | `StepAction.Select` was implemented in both bootstrap templates and documented in the tool description |
| 008 | In progress | GUIDO engine | Full end-to-end validation of the generated .NET engine still depends on rerunning CI or local `dotnet build` after the latest fixes |

## Next verification steps

1. Run `node --test test/demo-store.test.mjs`
2. Run `npm test`
3. Run `npm run guido:validate`
4. Confirm the `guido-engine` GitHub Action turns green after the bootstrap fixes
