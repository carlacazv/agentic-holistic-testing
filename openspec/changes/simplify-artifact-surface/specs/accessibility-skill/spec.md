## MODIFIED Requirements

### Requirement: Durable honest return
The skill SHALL return scope, axe results, manual checks, evidence index, unresolved criteria, and linked defects as one canonical audit document, rendered by one summary document, with each defect keeping its own draft. Unresolved criteria SHALL be derived from the manual checks rather than duplicated as a separate artifact, and metrics SHALL be carried by the return envelope. Raw axe output SHALL remain under the ignored raw evidence directory. `completed` requires no failed or unresolved in-scope checks.

#### Scenario: Manual environment missing
- **WHEN** valid axe results exist but manual evaluation cannot be completed
- **THEN** the skill returns `partial` with residual conformance risk

#### Scenario: Unresolved criteria are read from the audit
- **WHEN** an audit records manual checks with unresolved status
- **THEN** they are derived from the canonical audit document and reported in the summary rather than indexed as a separate artifact
