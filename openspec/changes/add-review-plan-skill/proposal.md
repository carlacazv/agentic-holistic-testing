## Why

A structurally valid plan can still contain weak prioritization, missing techniques, and unjustified gaps. An independent review capability must prove what improved and preserve an exact audit trail.

## What Changes

- Add independently callable `holistic-qa:review-plan` instructions.
- Validate the input and improved plan bundles against the `plan` contract.
- Produce findings, coverage gaps, exact modifications, before/after metrics, and checksums.
- Add seeded-defect fixtures that prove coverage and prioritization improve.

## Capabilities

### New Capabilities

- `review-plan-skill`: Evidence-based plan review and improvement with measurable before/after results.

### Modified Capabilities

None.

## Impact

Adds a review module, schema, artifacts, Codex skill registration, fixtures, tests, and documentation. It depends directly on the archived plan and foundation contracts.
