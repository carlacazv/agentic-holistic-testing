## Why

The first user-facing capability must turn requirements and risks into a complete, traceable, reviewable test plan instead of free-form prose that can silently omit coverage.

## What Changes

- Add the independently callable `holistic-qa:plan` Codex skill.
- Define and validate requirements, risks, test cases, steps, traceability links, test-data prerequisites, and technique/heuristic rationale.
- Apply the shared impact × likelihood priority thresholds and explicit coverage dispositions.
- Generate deterministic CSV, Markdown, JSON metrics, checksums, and a foundation return envelope.
- Add fixtures that exercise boundaries, decisions, state transitions, equivalence classes, scenarios, pairwise selection, error guessing, SFDIPOT, and FEW HICCUPPS.

## Capabilities

### New Capabilities

- `plan-skill`: Risk-prioritized test planning with complete requirement/risk traceability and explicit rationale.

### Modified Capabilities

None.

## Impact

Adds plan-specific schemas, a validation and metrics module, the provider-neutral skill source, Codex adapter output, fixture requirements, tests, and README workflow documentation. It depends only on the archived foundation contract.
