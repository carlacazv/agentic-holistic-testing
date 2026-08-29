## MODIFIED Requirements

### Requirement: Verification artifacts
The skill SHALL return approved TypeScript tests, fixtures, configuration, CI integration, locator/testability findings, and verification results including repeated execution and HTML, JUnit, JSON, trace, screenshot, and video configuration. An accepted implementation SHALL carry at least one approved candidate, at least one spec file, and an executed-test count that is a positive integer covering every declared spec, so an empty or under-executed run cannot be accepted.

#### Scenario: Stable repeated run
- **WHEN** generated tests pass each required repetition with consistent results
- **THEN** verification records the repetition count and zero accepted flaky outcomes

#### Scenario: Empty implementation
- **WHEN** a manifest declares no candidate, no spec, or an executed-test count that does not cover its declared specs
- **THEN** validation fails and the implementation is not accepted, even when the reported totals are internally consistent

### Requirement: Deterministic execution
Generated tests SHALL be deterministic under repeated parallel execution. Fixed waits, network-idle waits, element handles, and assertions on sampled boolean state SHALL be rejected in favor of retrying web-first assertions and waits on a specific element or response. A positional or structural locator SHALL require a `locator` finding, and a skipped or quarantined test SHALL require an `exclusion` finding whether it is excluded individually or as a suite. A focused test SHALL be rejected outright, because it removes the rest of the run from consideration while the repetition evidence stays internally consistent. Tests SHALL create their own data with a run-scoped key, clean up through the API rather than the interface under test, and SHALL NOT depend on execution order or shared mutable state.

#### Scenario: Sampled state assertion
- **WHEN** generated code reads a boolean element state and asserts on that sampled value instead of using a retrying assertion
- **THEN** validation fails before the implementation is accepted

#### Scenario: Justified positional locator
- **WHEN** position is the behavior under test and a locator finding records why
- **THEN** the positional locator is accepted

#### Scenario: Unrecorded exclusion
- **WHEN** a test or a whole suite is skipped without an exclusion finding
- **THEN** validation fails and the implementation is not accepted

#### Scenario: Focused test
- **WHEN** generated code focuses a test or a suite
- **THEN** validation fails and no finding category justifies it
