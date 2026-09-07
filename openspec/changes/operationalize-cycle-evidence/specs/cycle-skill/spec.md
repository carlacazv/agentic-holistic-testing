## MODIFIED Requirements

### Requirement: Resumable state
The cycle SHALL be startable, resumable, completable, and summarizable through versioned CLI commands. State writes SHALL be atomic and a completed step SHALL record its run ID.

#### Scenario: Session resumes
- **WHEN** a valid persisted cycle is resumed
- **THEN** the CLI returns its summary and next eligible skill without repeating completed work

#### Scenario: Step completes
- **WHEN** the expected skill completes with a run ID
- **THEN** the state is atomically updated before the next step is selected
