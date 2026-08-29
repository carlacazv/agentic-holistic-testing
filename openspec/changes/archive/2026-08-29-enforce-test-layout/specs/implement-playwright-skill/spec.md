## ADDED Requirements

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

## MODIFIED Requirements

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
