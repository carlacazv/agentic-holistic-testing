## Why

Accessibility needs combined automated and human evidence; an axe-only pass cannot establish WCAG 2.2 AA conformance or expose keyboard, focus, reflow, and assistive-technology gaps.

## What Changes

- Add independently callable `holistic-qa:accessibility` instructions.
- Define WCAG 2.2 AA scope, axe results, manual criteria checks, evidence, unresolved criteria, and linked local defects.
- Add axe to the real fixture Playwright suite and deterministic audit validation/rendering.
- Preserve partial status whenever required criteria remain unresolved.

## Capabilities

### New Capabilities

- `accessibility-skill`: WCAG 2.2 AA auditing with automated axe and manual evidence.

### Modified Capabilities

None.

## Impact

Adds exact axe dev dependency, fixture scan, audit module/schema, Codex skill, tests, artifacts, and docs.
