# plan-skill Specification

## Purpose
Produces a risk-prioritized, technique-driven test plan whose requirements, risks, cases, steps, data needs, and coverage dispositions are fully traceable and machine-validatable.

## Requirements

### Requirement: Planning inputs and stable records
The skill SHALL accept requirements, acceptance criteria, known risks, scope boundaries, target environment, and available product context. It SHALL assign stable IDs without replacing source identifiers and SHALL return `blocked` when no testable requirement or authoritative behavior source is available.

#### Scenario: Testable source is available
- **WHEN** at least one requirement or accepted behavior source can be analyzed
- **THEN** the skill records normalized requirements and inputs with stable identifiers

#### Scenario: No behavior source
- **WHEN** no testable requirement or accepted behavior source is provided or discoverable
- **THEN** the skill returns `blocked` with the exact input needed to continue

### Requirement: Risk scoring and priority
Each risk SHALL have integer impact and likelihood values from 1 through 5, exposure equal to impact × likelihood, and priority P0 for 20–25, P1 for 12–19, P2 for 6–11, or P3 for 1–5.

#### Scenario: Priority boundaries
- **WHEN** exposure values are 1, 5, 6, 11, 12, 19, 20, and 25
- **THEN** the assigned priorities are respectively P3, P3, P2, P2, P1, P1, P0, and P0

### Requirement: Technique-driven coverage
The plan SHALL select equivalence partitioning, strict three-point boundary analysis, decision tables, state transitions, scenario testing, pairwise selection, and error guessing according to requirement shape. It SHALL select relevant exploratory heuristics including SFDIPOT and FEW HICCUPPS and record why each applied or was not applicable.

#### Scenario: Bounded numeric input
- **WHEN** a requirement declares a minimum or maximum numeric value
- **THEN** the plan includes tests at immediately below, exactly at, and immediately above each relevant boundary

#### Scenario: Interacting rules
- **WHEN** outcomes depend on multiple conditions
- **THEN** the plan uses a complete decision table or records a justified, traceable reduction technique

### Requirement: Complete traceability
Every accepted requirement and identified risk SHALL link to one or more tests or have an explicit `deferred`, `waived`, `externally-covered`, or `not-testable` disposition with rationale. Every test SHALL link to at least one requirement or risk.

#### Scenario: Unlinked requirement
- **WHEN** an accepted requirement has neither a test link nor an allowed disposition
- **THEN** validation fails and identifies the requirement ID

### Requirement: Durable plan bundle
The skill SHALL return requirements, risks, test cases, test steps, requirement-test links, risk-test links, test-data prerequisites, technique and heuristic rationale, metrics, and checksums as durable artifacts using the foundation CSV and artifact contracts.

#### Scenario: Complete bundle
- **WHEN** all declared scope is planned and every artifact validates
- **THEN** the skill returns `completed` with requirement and risk coverage metrics equal to 100 percent

#### Scenario: Valid incomplete bundle
- **WHEN** part of the scope cannot be planned but valid artifacts cover the remainder
- **THEN** the skill returns `partial` and identifies uncovered IDs and residual risk

### Requirement: Safe planning behavior
The planning skill SHALL be read-only with respect to target applications and external issue trackers. It SHALL not publish defects, create test data, or execute tests.

#### Scenario: External publication requested implicitly
- **WHEN** planning identifies a likely defect without explicit publication approval
- **THEN** it records the finding only in durable local artifacts
