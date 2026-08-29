## MODIFIED Requirements

### Requirement: Declared UI abstraction
Every spec covering a browser candidate SHALL declare its UI abstraction as a page object, a component object, or inline, chosen from the approved candidates and the surfaces they traverse. A component object SHALL be chosen from repetition of a widget across the approved browser specs rather than from a strategy row, because a case whose confidence is equivalent at component level is covered at that level and never becomes a Playwright candidate. Inline SHALL require a recorded rationale and SHALL be rejected when more than one browser candidate is approved. A declared page or component object SHALL be provided as a non-spec TypeScript file that exposes locators and actions only, declaring no tests and containing no assertions. API candidates SHALL NOT require a UI abstraction.

#### Scenario: Inline abstraction across multiple browser candidates
- **WHEN** more than one browser candidate is approved and a spec declares an inline abstraction
- **THEN** validation fails and requires a page or component object

#### Scenario: Declared object is missing
- **WHEN** a spec declares a page or component object that the implementation does not provide
- **THEN** validation fails and names the undeclared abstraction

#### Scenario: Object carrying assertions
- **WHEN** a declared page or component object contains an assertion or declares a test
- **THEN** validation fails so every expectation stays attributable to a Should step

#### Scenario: Widget repeated across routes
- **WHEN** the same widget's locators are needed by approved browser specs under more than one route or flow
- **THEN** the widget is modeled as a component object and composed into the page objects that use it
