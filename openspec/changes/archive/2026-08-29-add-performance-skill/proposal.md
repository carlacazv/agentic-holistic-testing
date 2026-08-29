## Why

Performance results are misleading without declared budgets or a repeatable baseline and variability. The capability must distinguish regressions from noise and must never manufacture an SLA.

## What Changes

- Add independently callable `holistic-qa:performance` instructions.
- Support explicit budget evaluation or comparable Lighthouse/API baseline mode.
- Preserve raw samples, summaries, variability, regressions, evidence, and linked local defect drafts.
- Add a real Lighthouse and API timing fixture runner.

## Capabilities

### New Capabilities

- `performance-skill`: Budget-aware or baseline performance evaluation with variability and regression evidence.

### Modified Capabilities

None.

## Impact

Adds exact Lighthouse dev dependency, fixture runner, audit module/schema, Codex skill, tests, artifacts, and docs.
