# review-plan-skill Specification

## Purpose
Reviews and improves an existing holistic QA plan while preserving exact evidence of findings, coverage changes, prioritization changes, and artifact integrity.

## Requirements

### Requirement: Validated upstream input
The skill SHALL require a plan bundle and its artifact index, verify checksums before review, and return `blocked` when the upstream bundle is missing or unreadable.

#### Scenario: Tampered input
- **WHEN** an upstream plan artifact checksum does not match
- **THEN** review stops and returns a blocking integrity error

### Requirement: Independent review dimensions
The review SHALL assess requirement and risk traceability, technique fit, strict boundaries, decision coverage, state and scenario coverage, data prerequisites, priority scoring, clarity, duplication, executability, and heuristic rationale.

#### Scenario: Seeded coverage omission
- **WHEN** a requirement lacks both test links and a valid disposition
- **THEN** the review records a finding with the exact requirement ID and severity

### Requirement: Exact improvements
Each modification SHALL identify its operation, target path or record ID, before value, after value, rationale, and linked finding. The improved bundle SHALL pass the plan validator.

#### Scenario: Cosmetic-only edit
- **WHEN** modifications do not resolve a finding or improve a declared quality dimension
- **THEN** the review SHALL not claim that the plan improved

### Requirement: Measured result
The skill SHALL return before and after metrics, findings, remaining coverage gaps, both bundle checksums, exact modifications, and the improved plan bundle.

#### Scenario: Successful improvement
- **WHEN** seeded omissions and wrong priorities are corrected
- **THEN** after metrics show no regression, resolved findings are traceable to modifications, and the result is `completed`

### Requirement: Honest residual risk
The skill SHALL return `partial` when the improved plan remains valid but material review scope or identified issues remain unresolved, and SHALL list residual risks without silently accepting them.

#### Scenario: Source ambiguity remains
- **WHEN** a finding cannot be resolved without product authority
- **THEN** it remains open with an explicit unblocker and residual risk
