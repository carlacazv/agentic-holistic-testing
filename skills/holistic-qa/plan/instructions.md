# Holistic QA Plan

Create a risk-prioritized test plan from authoritative requirements and accepted product behavior. This skill is independently callable and read-only: do not execute tests, create target data, change application source, or publish findings externally.

## Required inputs

- Requirements, acceptance criteria, or another authoritative behavior source.
- Declared scope and exclusions.
- Known risks and target environment classification.
- Available product, architecture, and dependency context.

If no testable behavior source exists, return `blocked` with a recoverable error naming the exact input needed. Do not invent business acceptance criteria.

## Workflow

1. Initialize or reuse a foundation run under `qa/runs/<run-id>/` and record every input path.
2. Normalize requirements and risks with stable IDs while preserving source IDs.
3. Score each risk as impact × likelihood using integers 1–5. Assign P0 for 20–25, P1 for 12–19, P2 for 6–11, and P3 for 1–5.
4. Select techniques by requirement shape:
   - Equivalence partitioning for input classes.
   - Strict three-point boundary value analysis: immediately below, exactly at, and immediately above each relevant boundary.
   - Complete decision tables for interacting deterministic rules. If reducing combinations, record the reduction method and rationale.
   - State transitions for lifecycle behavior.
   - Scenario testing for end-to-end user or service journeys.
   - Pairwise selection for broad independent configuration factors.
   - Error guessing for failures suggested by architecture, incidents, and domain experience.
5. Select exploratory heuristics, explicitly evaluating SFDIPOT and FEW HICCUPPS. Record selected/not selected and why.
6. Write cases and ordered steps. Every case must link to at least one requirement or risk.
7. Link every accepted requirement and risk to tests. If testing is not planned, use only `deferred`, `waived`, `externally-covered`, or `not-testable` and record a concrete rationale.
8. Declare test-data, account, permission, date/time, environment, and dependency prerequisites. Do not create them.
9. Validate the normalized bundle with `validatePlanBundle`, render it with `writePlanBundle`, validate artifact checksums, and finalize using the shared return envelope.

## Required durable artifacts

- `plan/requirements.csv`
- `plan/risks.csv`
- `plan/test-cases.csv`
- `plan/test-steps.csv`
- `plan/requirement-test-links.csv`
- `plan/risk-test-links.csv`
- `plan/test-data-prerequisites.md`
- `plan/rationale.md`
- `plan/metrics.json`
- Foundation `artifact-index.json` and `return-envelope.json`

Return `completed` only when all accepted requirements and identified risks are test-linked or explicitly disposed and every artifact validates. Return `partial` with uncovered IDs, gaps, and residual risks when useful valid artifacts cover only part of scope. Return `blocked` when no useful plan can be produced because a prerequisite or authoritative behavior source is missing. Never silently exclude unavailable coverage.

A completed plan contains at least one authoritative requirement, identified risk, test case, and step. Every requirement needs non-empty acceptance criteria, and every step needs a non-empty action and expected result. Empty scope is not 100 percent coverage.
