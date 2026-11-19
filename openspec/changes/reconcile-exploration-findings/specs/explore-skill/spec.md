# Explore Skill Delta

## ADDED Requirements

### Requirement: Case execution records
When a session runs against a plan, it SHALL record one execution per touched plan case with outcome, notes, evidence, and linked findings. A failed execution SHALL link at least one finding, and plan cases without a record SHALL be reported as gaps.

#### Scenario: Failed case without a finding
- **WHEN** an execution has status `fail` and no linked finding
- **THEN** session validation rejects it

#### Scenario: Planned case never recorded
- **WHEN** executions are reconciled against the plan and a plan case has no record
- **THEN** the case is listed as unrecorded so it can be reported as a gap

### Requirement: Finding reconciliation
Before a finding is reported as a defect, the skill SHALL check later authoritative decisions and classify the finding as `defect`, `accepted-deviation`, `spec-conflict`, or `improvement`. Any classification other than `defect` SHALL cite its deciding oracle sources, and only `defect` findings SHALL count as defects in metrics.

#### Scenario: Deviation accepted at sign-off
- **WHEN** a finding is classified as `accepted-deviation` without oracle sources
- **THEN** session validation rejects it

#### Scenario: Metrics exclude non-defects
- **WHEN** a session contains an accepted deviation and a confirmed defect
- **THEN** exploration metrics count one confirmed defect

### Requirement: Tracker duplicate check
The skill SHALL search the tracker for each finding before drafting and again before publication. It SHALL record matches as `duplicate` or `related` references and SHALL add evidence to a duplicate instead of opening a second item.

#### Scenario: Invalid tracker relation
- **WHEN** a finding references a tracker item with a relation other than `duplicate` or `related`
- **THEN** session validation rejects it
