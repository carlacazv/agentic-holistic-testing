## Purpose

Selects the lowest effective automation level for every planned case and produces an approval-gated candidate matrix for downstream Playwright implementation.

## ADDED Requirements

### Requirement: Complete candidate matrix
Every planned test case SHALL have impact value, stability, cost, recommended level, Playwright browser suitability, Playwright API suitability, decision, and rationale.

#### Scenario: Missing planned case
- **WHEN** a plan case has no strategy row
- **THEN** validation fails with the case ID

### Requirement: Lowest effective level
The recommendation SHALL prefer unit, then component, then API, then browser E2E when that lower level can provide equivalent confidence; human judgment and non-automatable checks SHALL remain manual.

#### Scenario: API-visible behavior
- **WHEN** behavior is fully observable and controllable at the HTTP boundary without browser-only risk
- **THEN** API is recommended instead of browser E2E

### Requirement: Evidence-based decision
Impact value, stability, and cost SHALL use integers 1–5. Each automate, manual, or defer decision SHALL include rationale and preserve higher-level/manual coverage when lower levels are insufficient.

#### Scenario: Unstable candidate
- **WHEN** automation depends on an uncontrolled or unstable signal
- **THEN** the row records the stability risk and does not present automation as unconditionally approved

### Requirement: Explicit Playwright approval
Only rows explicitly approved for implementation and recommended at API or browser E2E SHALL become downstream Playwright candidates. Strategy generation SHALL not create test code.

#### Scenario: Recommendation without approval
- **WHEN** API automation is recommended but approval is absent
- **THEN** the row remains outside the implementation candidate set

### Requirement: Durable strategy return
The skill SHALL return the candidate matrix, summary metrics, gaps, residual risks, and foundation control files, using `partial` or `blocked` rather than silently excluding cases.

#### Scenario: Complete strategy
- **WHEN** every plan case is assessed and artifacts validate
- **THEN** the skill returns `completed` with 100 percent case coverage
