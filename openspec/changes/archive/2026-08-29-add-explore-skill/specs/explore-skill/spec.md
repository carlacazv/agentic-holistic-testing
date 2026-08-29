## Purpose

Performs timeboxed, heuristic-guided exploratory testing with transparent coverage, indexed evidence, and reproducible local defect drafts.

## ADDED Requirements

### Requirement: Authorized charter
Each session SHALL declare mission, scope, risks, heuristics, timebox, environment, capabilities, and stop conditions before execution. State changes SHALL be limited to declared non-production environments.

#### Scenario: Production mutation charter
- **WHEN** a production charter requests a state-changing capability
- **THEN** execution is blocked before browser interaction

### Requirement: Session and coverage notes
The skill SHALL record timestamped observations, actions, questions, oracles, covered areas, depth, and explicit gaps without equating an empty observation set with absence of defects.

#### Scenario: Unavailable area
- **WHEN** an area cannot be exercised
- **THEN** coverage notes identify it as a gap and the result is partial when other valid work exists

### Requirement: Evidence integrity
Evidence SHALL be indexed by stable ID, type, raw path, durable redacted path when promoted, checksum, confidence, and linked observations or defects.

#### Scenario: Sensitive browser evidence
- **WHEN** evidence contains credentials or tokens
- **THEN** raw evidence remains ignored and only a redacted durable copy is indexed for reporting

### Requirement: Reproducible defect folders
Every confirmed or suspected defect SHALL have one local folder with title, status, environment, preconditions, exact steps, expected result, actual result, reproducibility, severity rationale, and evidence links.

#### Scenario: Suspected defect lacks evidence
- **WHEN** an observation cannot yet be reproduced or evidenced
- **THEN** it remains suspected with explicit follow-up rather than confirmed

### Requirement: Publication and status safety
External defect publication SHALL require explicit approval. Missing browser, authorization, environment, or data SHALL yield `blocked` or `partial`, never silent exclusion.

#### Scenario: No browser capability
- **WHEN** browser coverage is required and all fallbacks are unavailable
- **THEN** the skill records the uncovered charter scope and returns blocked or partial as applicable
