## ADDED Requirements

### Requirement: Declared review outcome
The skill SHALL report its findings for reading before it writes anything, and SHALL create no run when the reader acts on none of them. The outcome SHALL be declared as a mode rather than assumed: `apply` permits records to be changed and, when a removal modification names them, to leave the plan; `complement` SHALL permit additions only, so every record and link present before the review is present and unchanged after it. A review that declares no recognized mode SHALL be rejected.

#### Scenario: Findings read without action
- **WHEN** the reader acts on none of the reported findings
- **THEN** no run directory, envelope, or artifact is created and the plan is untouched

#### Scenario: Complement removes or rewrites
- **WHEN** a complement omits or changes a record or link that the reviewed bundle already carried
- **THEN** validation fails naming that record or link

#### Scenario: Undeclared mode
- **WHEN** a review does not declare `apply` or `complement`
- **THEN** validation fails naming the accepted outcomes rather than assuming one

## MODIFIED Requirements

### Requirement: Measured result
The skill SHALL return before and after metrics, findings, remaining coverage gaps, both bundle checksums, exact modifications, and the improved plan bundle. The durable result SHALL be the improved plan bundle and one review document carrying the declared mode, both checksums, the findings, the modifications, the before and after coverage, and the remaining gaps.

#### Scenario: Successful improvement
- **WHEN** seeded omissions and wrong priorities are corrected
- **THEN** after metrics show no regression, resolved findings are traceable to modifications, and the result is `completed`

#### Scenario: Result is read as one document
- **WHEN** a review run finalizes
- **THEN** it holds the improved plan bundle and a single review document rather than a set of separate evidence files
