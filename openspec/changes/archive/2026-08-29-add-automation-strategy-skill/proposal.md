## Why

Test plans need a defensible automation decision per case before code generation; otherwise teams overuse browser tests, automate unstable behavior, or lose manual coverage without recording why.

## What Changes

- Add independently callable `holistic-qa:automation-strategy` instructions.
- Recommend the lowest effective unit, component, API, browser E2E, or manual level.
- Record Playwright browser/API suitability, impact value, stability, cost, decision, and rationale.
- Separate recommendations from explicit approval and expose only approved Playwright candidates downstream.

## Capabilities

### New Capabilities

- `automation-strategy-skill`: Risk-aware automation-level decisions and approved Playwright candidate selection.

### Modified Capabilities

None.

## Impact

Adds a strategy module, schema, CSV artifact, metrics, Codex skill, fixtures, tests, and documentation on top of plan contracts.
