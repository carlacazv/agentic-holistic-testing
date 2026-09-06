# cycle-skill Specification

## Purpose
Coordinates a quality workflow from a user goal without removing independent access to any QA skill.

## Requirements

### Requirement: Optional orchestration
The cycle SHALL select and sequence relevant skills when the user requests a broad quality assessment. Explicit invocation of one skill SHALL remain limited to that skill and its real prerequisites.

#### Scenario: Accessibility only
- **WHEN** the user explicitly invokes accessibility
- **THEN** the cycle selects accessibility alone and does not start planning or performance work

### Requirement: Resumable state
The cycle SHALL preserve its goal, selected and completed skills, run IDs, open questions, and status in a schema-valid state document.

#### Scenario: Interrupted workflow
- **WHEN** an active cycle resumes
- **THEN** the next eligible skill is selected without repeating completed steps

