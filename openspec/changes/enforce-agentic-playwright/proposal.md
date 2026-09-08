## Why

The implementation skill describes maintainable Playwright practices, but its runtime validator previously recognized only specs and page/component objects and relied mostly on text patterns. That gap allowed generated automation to import Playwright directly, construct page objects in specs, own browser contexts manually, omit traceability and cleanup, and still produce apparently valid evidence.

The corrected Planning Poker suite provides a concrete architecture worth preserving. Future generation needs a versioned, executable contract so quality does not depend on whether a model remembers prose instructions.

## What Changes

- Add a default `agentic-playwright` architecture profile with layered specs, page/component objects, fixtures, factories, static data, enums, and configuration.
- Permit a `repository-native` profile only when it provides equivalent controls and records a rationale.
- Parse TypeScript into an AST and enforce central fixture imports, fixture-owned object/context construction, per-test tags and case annotations, assertion steps, typed data, explicit cleanup, and config/CI gates.
- Bind evidence checksums to architecture, candidates, configuration, CI commands, and all declared sources.
- Treat the merged Planning Poker implementation as a golden structural and executable benchmark, triggered whenever the implementation contract changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `implement-playwright-skill`: Generated automation now has a versioned architecture contract and structural validation in addition to existing flake, locator, approval, and evidence controls.

## Impact

Affects the Playwright implementation stage and schema, its provider-neutral skill instructions, test fixtures, Planning Poker benchmark workflow, package dependencies, README, and implementation tests. Existing implementation manifests need the new architecture, complete file declarations, cleanup metadata, pinned configuration, and CI command map before they can be finalized.
