## MODIFIED Requirements

### Requirement: Resumable state
The cycle SHALL be startable, resumable, completable, and summarizable through versioned CLI commands. State writes SHALL be atomic, missing output parent directories SHALL be created, and a completed step SHALL reference a checksum-valid run whose envelope matches the expected skill and run ID.

#### Scenario: Nested state output
- **WHEN** cycle state is started at a path whose parent directory does not exist
- **THEN** the CLI creates the parent and atomically persists valid state

#### Scenario: Missing or invalid run
- **WHEN** completion references a malformed ID, absent run, invalid artifact set, or mismatched skill envelope
- **THEN** the CLI rejects completion and leaves the cycle state unchanged

#### Scenario: Valid run completes a step
- **WHEN** the next skill has a checksum-valid run and matching return envelope
- **THEN** the CLI atomically records the skill and run ID before selecting the next step
