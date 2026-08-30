## MODIFIED Requirements

### Requirement: Verification artifacts
The skill SHALL return approved TypeScript tests, fixtures, configuration, CI integration, locator/testability findings, and verification results including repeated execution and HTML, JUnit, JSON, trace, screenshot, and video configuration. The findings and the verification results SHALL be carried inside one canonical implementation document rather than beside it, rendered by one summary document. An accepted implementation SHALL carry at least one approved candidate, at least one spec file, and an executed-test count that is a positive integer covering every declared spec, so an empty or under-executed run cannot be accepted.

#### Scenario: Stable repeated run
- **WHEN** generated tests pass each required repetition with consistent results
- **THEN** verification records the repetition count and zero accepted flaky outcomes

#### Scenario: Empty implementation
- **WHEN** a manifest declares no candidate, no spec, or an executed-test count that does not cover its declared specs
- **THEN** validation fails and the implementation is not accepted, even when the reported totals are internally consistent

#### Scenario: Findings and verification are read with the implementation
- **WHEN** an implementation run finalizes
- **THEN** its findings and verification results are fields of the canonical implementation document rather than separate indexed artifacts
