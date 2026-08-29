## Why

Approved Playwright candidates need a controlled implementation path that produces maintainable TypeScript tests and proves execution stability without expanding scope or modifying application source implicitly.

## What Changes

- Add independently callable `holistic-qa:implement-playwright` instructions.
- Gate code generation on approved API/browser strategy candidates and environment permissions.
- Require accessible locators, web-first assertions, deterministic fixtures, configuration, CI integration, findings, and verification results.
- Add a local web/API fixture app and repeat Playwright execution three times.

## Capabilities

### New Capabilities

- `implement-playwright-skill`: Approval-gated TypeScript Playwright implementation and repeatability verification.

### Modified Capabilities

None.

## Impact

Adds Playwright as an exact dev dependency, fixture app/config/tests, implementation validator, schema, Codex skill, tests, artifacts, and documentation.
