## MODIFIED Requirements

### Requirement: Verifiable execution
Implementation verification SHALL be derived from Playwright JSON reporter output and bound to the executed command, report checksum, and implementation source checksum. Product failures SHALL remain valid QA evidence.

#### Scenario: Hand-authored verification
- **WHEN** verification does not identify Playwright JSON reporter provenance
- **THEN** validation rejects the claim

#### Scenario: Evidence is written without the raw report
- **WHEN** a caller attempts to persist implementation evidence without supplying the Playwright JSON report
- **THEN** the writer rejects the run even if declared verification fields appear valid

#### Scenario: Runner assertion failure
- **WHEN** an imported reporter result contains a failed assertion
- **THEN** verification records failure without invalidating the completed QA work
