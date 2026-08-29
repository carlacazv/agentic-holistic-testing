## Purpose

Converts only explicitly approved Playwright API and browser candidates into maintainable TypeScript tests, fixtures, configuration, CI integration, and repeatable verification evidence.

## ADDED Requirements

### Requirement: Approval and permission gate
The skill SHALL generate code only for strategy rows marked automate and explicitly approved at API or browser E2E, after validating upstream checksums and target-environment permissions.

#### Scenario: Unapproved candidate
- **WHEN** a recommended candidate lacks explicit approval
- **THEN** no code is generated for that candidate and the gap is reported

### Requirement: Maintainable TypeScript tests
Generated tests SHALL use TypeScript, isolated deterministic data, descriptive case IDs, reusable fixtures where justified, and no blind sleeps or accepted retries that hide instability.

#### Scenario: Blind wait
- **WHEN** generated code contains a fixed timeout wait
- **THEN** validation fails before the implementation is accepted

### Requirement: Browser interaction quality
Browser tests SHALL prefer accessible user-facing locators and web-first assertions. CSS/XPath or test IDs SHALL require a locator/testability finding. Application-source changes SHALL require separate approval.

#### Scenario: Inaccessible-only locator
- **WHEN** a stable accessible locator exists but generated code uses a structural selector
- **THEN** the implementation is rejected or corrected and the finding is recorded

### Requirement: API implementation quality
API tests SHALL use Playwright request contexts, validate observable status/body/contracts, isolate state, and avoid browser navigation when equivalent API confidence is sufficient.

#### Scenario: Approved API candidate
- **WHEN** an API candidate is approved
- **THEN** implementation uses request-level coverage without unnecessary browser execution

### Requirement: Verification artifacts
The skill SHALL return approved TypeScript tests, fixtures, configuration, CI integration, locator/testability findings, and verification results including repeated execution and HTML, JUnit, JSON, trace, screenshot, and video configuration.

#### Scenario: Stable repeated run
- **WHEN** generated tests pass each required repetition with consistent results
- **THEN** verification records the repetition count and zero accepted flaky outcomes

### Requirement: Honest failure status
Missing browser capability, test data, permission, or target access SHALL produce `blocked` or `partial`; failed or flaky tests SHALL not be reclassified as completed.

#### Scenario: Flaky outcome
- **WHEN** a test passes only after retry or fails in any required repetition
- **THEN** the skill records the failure evidence and does not return `completed`
