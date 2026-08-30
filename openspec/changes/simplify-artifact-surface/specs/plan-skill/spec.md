## MODIFIED Requirements

### Requirement: Durable plan bundle
The skill SHALL return requirements, risks, test cases, test steps, requirement-test links, risk-test links, test-data prerequisites, and technique and heuristic rationale as one canonical plan document, rendered by one summary document, following the foundation canonical artifact shape. The canonical document SHALL carry the relations between its collections rather than leaving them to be rebuilt from separate files. Coverage metrics SHALL be carried by the return envelope.

#### Scenario: Complete bundle
- **WHEN** all declared scope is planned and every artifact validates
- **THEN** the skill returns `completed` with requirement and risk coverage metrics equal to 100 percent

#### Scenario: Valid incomplete bundle
- **WHEN** part of the scope cannot be planned but valid artifacts cover the remainder
- **THEN** the skill returns `partial` and identifies uncovered IDs and residual risk

#### Scenario: Plan is read as one document
- **WHEN** a plan run finalizes
- **THEN** the plan is held in one canonical document and one summary rather than split across a file per collection, and no separate rationale, prerequisite, or metrics artifact is indexed
