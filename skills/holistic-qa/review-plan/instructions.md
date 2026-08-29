# Holistic QA Review Plan

Independently review an existing `holistic-qa:plan` bundle and produce a measurably improved, fully auditable bundle. Do not execute tests, alter product requirements, modify application source, or publish findings externally.

## Inputs and integrity gate

Require the upstream run ID, plan artifacts, artifact index, and return envelope. Validate every checksum before analysis. Return `blocked` if the bundle is absent, unreadable, or tampered with; never review an untrusted copy. A bundle whose collections are not readable as records is unusable input and stops the review before any metric is computed.

## Review dimensions

Assess requirement and risk traceability, impact × likelihood scoring, priority boundaries, technique fit, equivalence classes, strict three-point boundaries, decision permutations, states and transitions, scenarios, pairwise rationale, error guessing, SFDIPOT, FEW HICCUPPS, test-data prerequisites, clarity, duplication, executability, and explicit dispositions.

Record each finding with stable ID, severity, target record, evidence, status, and unblocker when open. Do not silently fix a finding: every change must record operation, target, before value, after value, rationale, and linked finding ID.

Validate the improved plan using the upstream plan contract. Calculate before/after metrics and canonical bundle checksums. Reject metric regression and do not claim improvement for cosmetic edits. Coverage that leaves the plan is a change like any other: every test case or step present before the review and absent after it requires a `remove` or `merge` modification naming that record ID, so a smaller plan is a recorded decision rather than a silent loss.

## Required artifacts

- `review-plan/improved-plan.json`
- `review-plan/findings.csv`
- `review-plan/modifications.csv`
- `review-plan/before-after-metrics.json`
- `review-plan/checksums.json`
- `review-plan/coverage-gaps.md`
- Foundation control files

Return `completed` when the declared review scope is covered, the improved plan validates, and every resolved finding maps to an exact modification. Return `partial` with open findings and residual risks when product authority or other inputs prevent resolution. Return `blocked` for an invalid upstream integrity gate.
