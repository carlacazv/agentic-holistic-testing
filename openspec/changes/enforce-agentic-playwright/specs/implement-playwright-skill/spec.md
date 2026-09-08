# Implement Playwright Skill Delta

## ADDED Requirements

### Requirement: Versioned automation architecture
Every implementation SHALL declare architecture standard version 1 and either the default `agentic-playwright` profile or a reasoned `repository-native` profile with structurally equivalent controls. The implementation SHALL declare one central fixture import and one supported test narrative style.

#### Scenario: Unreasoned native exception
- **WHEN** an implementation selects `repository-native` without a concrete rationale
- **THEN** validation fails before artifacts are written

### Requirement: Fixture-owned dependencies and lifecycle
Every spec SHALL import `test` and `expect` from the declared central fixture. Page and component objects SHALL be constructed in fixtures and injected into specs. Additional browser contexts and paired resource disposal SHALL be owned by lifecycle fixtures rather than specs.

#### Scenario: Monolithic browser spec
- **WHEN** a spec imports directly from Playwright, constructs a declared page object, or creates a browser context
- **THEN** structural validation rejects the implementation and names each violated boundary

### Requirement: Per-test traceability
Every test SHALL carry exactly one supported execution tag and a `test_case` annotation linked to the approved plan. Tags SHALL be attached to tests rather than describe blocks.

#### Scenario: Untagged generated test
- **WHEN** a generated test has no tag or no test-case annotation
- **THEN** validation fails even when its assertions execute successfully

### Requirement: Typed data and explicit cleanup
A state-mutating spec SHALL import a declared typed data factory and declare enforceable cleanup through `afterEach`, `afterAll`, or a named fixture. A read-only spec SHALL explicitly declare that cleanup is not required. Immutable data tables SHALL be TypeScript modules rather than JSON, and absolute environment URLs SHALL live only in configuration.

#### Scenario: State mutation without cleanup
- **WHEN** a spec declares or performs state mutation without the hook or fixture named by its cleanup strategy
- **THEN** validation fails before verification evidence is accepted

### Requirement: Structural source validation
The runtime SHALL parse declared TypeScript and evaluate imports, test calls, metadata, assertion nesting, classes, and object construction from the AST. Comments, strings, and malformed TypeScript SHALL NOT satisfy source requirements.

#### Scenario: Comment impersonates architecture
- **WHEN** a comment contains a fixture import, test declaration, or annotation but executable syntax does not
- **THEN** validation reports the missing executable structure

### Requirement: Golden consumer regression
The corrected Planning Poker implementation SHALL remain both a structural golden fixture and an executable external-repository benchmark. Changes to the implementation skill, schema, runtime validator, benchmark, or parser dependency SHALL trigger the benchmark workflow.

#### Scenario: Contract change regresses the consumer
- **WHEN** a pull request changes the Playwright generation contract and the Planning Poker suite no longer validates or executes three times with zero retries
- **THEN** the pull request check fails

## MODIFIED Requirements

### Requirement: Maintainable TypeScript tests
Generated tests SHALL use TypeScript, typed deterministic data, exact plan traceability, fixture injection, and explicit cleanup. Under the default profile, files SHALL be separated into specs, page/component objects, fixtures, factories, static data, enums, and configuration. The selected narrative style SHALL be enforced; assertions SHALL remain inside named `test.step` outcomes. Page/component objects SHALL expose locators and actions without assertions or tests. Blind sleeps, direct browser-lifecycle ownership in specs, `any`, and accepted retries that hide instability SHALL be rejected.

#### Scenario: Blind wait
- **WHEN** generated code contains a fixed timeout wait
- **THEN** validation fails before the implementation is accepted

#### Scenario: Undeclared behavior structure
- **WHEN** a describe or step title violates the selected narrative style, or a spec leaves an assertion outside a named step
- **THEN** validation fails and names the offending file and structure

#### Scenario: Architecture exists only in prose
- **WHEN** generated code violates a declared architectural rule even though its test result is green
- **THEN** deterministic validation rejects the manifest before runner evidence can finalize it

### Requirement: Declared file layout
Under `agentic-playwright`, specs SHALL be placed at `tests/<area>/<api|e2e|functional>/<name>.spec.ts`; page objects at `pages/<area>/<name>.page.ts`; component objects under `pages/components/` or an area's `components/`; fixtures under `fixtures/<api|helper|pom>/`; factories and static data under their respective `test-data` trees; enums under `enums/<area>/`; and configuration under `config/` or `playwright.config.ts`. A reasoned `repository-native` profile MAY preserve equivalent native paths while retaining all non-layout controls.

#### Scenario: Spec outside its feature folder
- **WHEN** a default-profile spec sits outside its area and API, E2E, or functional layer
- **THEN** validation fails naming the canonical spec path

#### Scenario: Object beside its spec
- **WHEN** a default-profile page or component object is placed beside a spec or lacks its kind suffix
- **THEN** validation fails naming the canonical object path

#### Scenario: Default-profile monolith
- **WHEN** a default-profile implementation places specs, objects, data, and lifecycle code together or outside their canonical paths
- **THEN** validation fails with the expected path for each declared kind

### Requirement: Verification artifacts
The skill SHALL declare and execute lint, TypeScript, and Playwright quality commands; pin the exact Playwright version, locale, and timezone; and configure HTML, JUnit, JSON, trace, screenshot, and video evidence. Verification SHALL run at least three times with zero retries. Its checksum SHALL bind architecture, candidates, configuration, CI commands, and every declared file path, kind, and source.

#### Scenario: Stable repeated run
- **WHEN** generated tests pass each required repetition with consistent results
- **THEN** verification records the repetition count and zero accepted flaky outcomes

#### Scenario: Empty implementation
- **WHEN** a manifest declares no candidate, no spec, or an executed-test count that does not equal its declared tests
- **THEN** validation fails even when the reported totals are internally consistent

#### Scenario: Configuration changes after execution
- **WHEN** configuration or CI commands change after runner evidence is imported
- **THEN** source-checksum validation marks the evidence stale and rejects finalization
