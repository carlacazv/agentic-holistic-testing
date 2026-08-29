## MODIFIED Requirements

### Requirement: Validated upstream input
The skill SHALL require a plan bundle and its artifact index, verify checksums before review, and return `blocked` when the upstream bundle is missing or unreadable. A bundle whose declared collections cannot be read as records SHALL stop the review before any metric is computed, and SHALL report the unreadable collection rather than failing during measurement.

#### Scenario: Tampered input
- **WHEN** an upstream plan artifact checksum does not match
- **THEN** review stops and returns a blocking integrity error

#### Scenario: Unreadable bundle
- **WHEN** either bundle is absent or declares a collection that is not a list of records
- **THEN** the review returns a blocking structural error, without before or after metrics

### Requirement: Exact improvements
Each modification SHALL identify its operation, target path or record ID, before value, after value, rationale, and linked finding. The improved bundle SHALL pass the plan validator. Coverage that leaves the plan SHALL be traceable: every test case, and every step whose test case survives, that is present before the review and absent after it SHALL be named by a removal or merge modification.

#### Scenario: Cosmetic-only edit
- **WHEN** modifications do not resolve a finding or improve a declared quality dimension
- **THEN** the review SHALL not claim that the plan improved

#### Scenario: Silent coverage removal
- **WHEN** the improved bundle drops test cases that no modification names
- **THEN** the review fails and names each removed record, even when every coverage percentage is unchanged

#### Scenario: Recorded duplicate merge
- **WHEN** duplicate cases are removed and each removed ID is named by a remove or merge modification linked to a finding
- **THEN** the smaller plan is accepted as a recorded decision
