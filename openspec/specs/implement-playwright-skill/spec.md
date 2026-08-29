# implement-playwright-skill Specification

## Purpose
Converts only explicitly approved Playwright API and browser candidates into maintainable TypeScript tests, fixtures, configuration, CI integration, and repeatable verification evidence.

## Requirements

### Requirement: Approval and permission gate
The skill SHALL generate code only for strategy rows marked automate and explicitly approved at API or browser E2E, after validating upstream checksums and target-environment permissions.

#### Scenario: Unapproved candidate
- **WHEN** a recommended candidate lacks explicit approval
- **THEN** no code is generated for that candidate and the gap is reported

### Requirement: Maintainable TypeScript tests
Generated tests SHALL use TypeScript, isolated deterministic data, descriptive case IDs preserved from the plan, and reusable fixtures where justified. Each spec SHALL express behavior as Given/When describes and Should steps: every describe title SHALL start with `Given ` or `When `, and every assertion SHALL be wrapped in a step whose title starts with `Should `. Arrange SHALL live in the Given scope, the Act SHALL be the single action its When block names, and assertions SHALL appear only inside Should steps. Repeated setup and locator chains SHALL be extracted, and an extracted helper SHALL NOT contain assertions belonging to a single test, branch on its caller, or carry state between tests. Blind sleeps and accepted retries that hide instability SHALL be rejected.

#### Scenario: Blind wait
- **WHEN** generated code contains a fixed timeout wait
- **THEN** validation fails before the implementation is accepted

#### Scenario: Undeclared behavior structure
- **WHEN** a describe title does not start with Given or When, or a spec wraps no assertion in a Should step
- **THEN** validation fails and names the offending file and title

### Requirement: Browser interaction quality
Browser tests SHALL prefer accessible user-facing locators and web-first assertions. An accessible locator SHALL be resolvable from the spec together with its declared page and component objects, while web-first assertions SHALL remain in the spec. CSS/XPath or test IDs SHALL require a locator/testability finding. Application-source changes SHALL require separate approval.

#### Scenario: Inaccessible-only locator
- **WHEN** a stable accessible locator exists but generated code uses a structural selector
- **THEN** the implementation is rejected or corrected and the finding is recorded

#### Scenario: Locators owned by a page object
- **WHEN** a browser spec asserts through locators defined in its declared page or component object
- **THEN** the accessible-locator requirement is satisfied and the assertions remain in the spec

### Requirement: API implementation quality
API tests SHALL use Playwright request contexts, validate observable status/body/contracts, isolate state, and avoid browser navigation when equivalent API confidence is sufficient.

#### Scenario: Approved API candidate
- **WHEN** an API candidate is approved
- **THEN** implementation uses request-level coverage without unnecessary browser execution

### Requirement: Verification artifacts
The skill SHALL return approved TypeScript tests, fixtures, configuration, CI integration, locator/testability findings, and verification results including repeated execution and HTML, JUnit, JSON, trace, screenshot, and video configuration. An accepted implementation SHALL carry at least one approved candidate, at least one spec file, and an executed-test count that is a positive integer covering every declared spec, so an empty or under-executed run cannot be accepted.

#### Scenario: Stable repeated run
- **WHEN** generated tests pass each required repetition with consistent results
- **THEN** verification records the repetition count and zero accepted flaky outcomes

#### Scenario: Empty implementation
- **WHEN** a manifest declares no candidate, no spec, or an executed-test count that does not cover its declared specs
- **THEN** validation fails and the implementation is not accepted, even when the reported totals are internally consistent

### Requirement: Honest failure status
Missing browser capability, test data, permission, or target access SHALL produce `blocked` or `partial`; failed or flaky tests SHALL not be reclassified as completed.

#### Scenario: Flaky outcome
- **WHEN** a test passes only after retry or fails in any required repetition
- **THEN** the skill records the failure evidence and does not return `completed`

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

### Requirement: Declared UI abstraction
Every spec covering a browser candidate SHALL declare its UI abstraction as a page object or a component object, chosen from the approved candidates and the surfaces they traverse, and the declared object SHALL be provided. A component object SHALL be chosen from repetition of a widget across the approved browser specs rather than from a strategy row, because a case whose confidence is equivalent at component level is covered at that level and never becomes a Playwright candidate. There SHALL be no inline abstraction: a single approved browser candidate SHALL name its object like any other. A declared page or component object SHALL be provided as a non-spec TypeScript file that exposes locators and actions only, declaring no tests and containing no assertions. API candidates SHALL NOT require a UI abstraction.

#### Scenario: Inline abstraction across multiple browser candidates
- **WHEN** more than one browser candidate is approved and a spec declares an inline abstraction
- **THEN** validation fails naming the page object and component object as the accepted values

#### Scenario: Inline abstraction for a single browser candidate
- **WHEN** exactly one browser candidate is approved and its spec declares an inline abstraction
- **THEN** validation fails on the same values, because no candidate count justifies keeping locators in the spec

#### Scenario: Declared object is missing
- **WHEN** a spec declares a page or component object that the implementation does not provide
- **THEN** validation fails and names the undeclared abstraction

#### Scenario: Object carrying assertions
- **WHEN** a declared page or component object contains an assertion or declares a test
- **THEN** validation fails so every expectation stays attributable to a Should step

#### Scenario: Widget repeated across routes
- **WHEN** the same widget's locators are needed by approved browser specs under more than one route or flow
- **THEN** the widget is modeled as a component object and composed into the page objects that use it

### Requirement: Declared file layout
Generated files SHALL sit where their kind belongs. A spec SHALL be placed at `tests/<feature>/<name>.spec.ts`, one folder per feature, and SHALL NOT sit directly under `tests/`, nest deeper, or live in the object folder. A page object SHALL be placed at `tests/pom/<name>.page.ts` and a component object at `tests/pom/<name>.component.ts`, so objects are shared across features by construction and each file's kind is visible from its name.

#### Scenario: Spec outside its feature folder
- **WHEN** a spec sits directly under the test root, nests below a feature folder, or is placed in the object folder
- **THEN** validation fails naming the required path

#### Scenario: Object beside its spec
- **WHEN** a page or component object is placed outside the object folder, or without the suffix its kind requires
- **THEN** validation fails naming the required path

### Requirement: Declared locator evidence
Every file that declares locators SHALL record whether they were confirmed against a running target or inferred. A locator confirmed by reading the accessibility snapshot of an authorized target, and resolving to exactly one element, SHALL be recorded as live-snapshot evidence; a locator derived from application source without a reachable target SHALL be recorded as inferred. Confirmation SHALL NOT be a prerequisite: an unavailable or unauthorized environment SHALL produce inferred locators and a declared gap rather than a blocked run, and inferred files SHALL be reported as gaps rather than presented as confirmed coverage.

#### Scenario: Locator confirmed against the running target
- **WHEN** the target environment is authorized and a locator resolves to exactly one element in its accessibility snapshot
- **THEN** the file records live-snapshot evidence

#### Scenario: No reachable target
- **WHEN** no authorized environment is available while locators are chosen
- **THEN** the files record inferred evidence, the run reports them as gaps, and the implementation remains completable

#### Scenario: Undeclared locator source
- **WHEN** a file declaring locators records no evidence value, or an unrecognized one
- **THEN** validation fails naming the accepted values
