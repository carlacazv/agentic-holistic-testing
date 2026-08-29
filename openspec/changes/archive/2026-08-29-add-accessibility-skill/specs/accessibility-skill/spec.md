## Purpose

Audits declared product scope against WCAG 2.2 Level AA using complementary automated, manual, evidence, unresolved-criterion, and defect artifacts.

## ADDED Requirements

### Requirement: Declared WCAG scope
Each audit SHALL identify pages, states, components, viewports, input methods, assistive technologies, exclusions, and WCAG 2.2 AA as the target.

#### Scenario: Scope unavailable
- **WHEN** a declared state or assistive technology cannot be evaluated
- **THEN** it remains an unresolved criterion and the audit cannot claim completed conformance

### Requirement: Automated axe evidence
The skill SHALL run axe against each declared automated scope state, preserve rule and node evidence, and link every violation to a local defect draft.

#### Scenario: Axe violation
- **WHEN** axe reports a serious violation
- **THEN** the result records the rule, impacted nodes, evidence, and linked defect

### Requirement: Manual accessibility evidence
The audit SHALL perform applicable manual checks including keyboard operation, focus visibility/order, accessible name/role/value, zoom and reflow, text spacing, contrast where automation is insufficient, errors, status messages, and target size.

#### Scenario: Automated scan passes
- **WHEN** axe reports no violations but required manual checks are absent
- **THEN** the audit remains partial rather than claiming WCAG conformance

### Requirement: Unresolved criteria and defects
Each failed check SHALL link to a local defect draft; each unresolved check SHALL record reason, risk, and unblocker. External publication requires approval.

#### Scenario: Failed manual check
- **WHEN** keyboard focus is not visible
- **THEN** the criterion fails with evidence and a reproducible local defect draft

### Requirement: Durable honest return
The skill SHALL return scope, axe results, manual checks, evidence index, unresolved criteria, linked defects, metrics, and foundation controls. `completed` requires no failed or unresolved in-scope checks.

#### Scenario: Manual environment missing
- **WHEN** valid axe results exist but manual evaluation cannot be completed
- **THEN** the skill returns `partial` with residual conformance risk
