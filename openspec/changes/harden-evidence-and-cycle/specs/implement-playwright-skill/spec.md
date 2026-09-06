# Implement Playwright Skill Delta

## MODIFIED Requirements

### Requirement: Verifiable execution
Implementation verification SHALL refer to executable collected tests and runner evidence associated with the source under review. Product failures SHALL be preserved as results rather than rejected as malformed implementation evidence.

#### Scenario: Comments resemble tests
- **WHEN** comments contain test and request tokens but no executable test declaration
- **THEN** validation rejects the implementation

#### Scenario: Assertion fails
- **WHEN** the runner records a failed product assertion
- **THEN** the implementation evidence remains valid and reports verification fail

