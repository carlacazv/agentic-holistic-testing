# report-skill Specification

## Purpose
Combines valid QA runs into an evidence-linked quality recommendation.

## Requirements

### Requirement: Separate result axes
The report SHALL distinguish workflow completion, verification outcome, and release recommendation.

#### Scenario: Completed QA finds a defect
- **WHEN** a completed run has failed verification
- **THEN** the report preserves completed workflow status and recommends not-ready

### Requirement: Evidence-linked recommendation
Every report SHALL name its source run IDs, evidence, gaps, residual risks, and decision owner when known.

#### Scenario: Required work is blocked
- **WHEN** a source run is blocked or partial
- **THEN** the report recommends insufficient-evidence and names the gap

