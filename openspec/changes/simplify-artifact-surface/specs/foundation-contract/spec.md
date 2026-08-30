## ADDED Requirements

### Requirement: Canonical artifact shape
Every skill's durable return SHALL take the same shape under its own directory in the run: exactly one canonical machine-readable document holding the content its validator accepted, exactly one summary document rendering that content for a reader, and evidence files only for content that cannot be carried inside the canonical document. A file that only renders or filters fields the canonical document already carries SHALL form part of the summary rather than a separate indexed artifact. Run metrics SHALL be carried by the return envelope alone, and no skill SHALL write a metrics artifact.

#### Scenario: Skill finalizes a run
- **WHEN** a skill finalizes a run with its declared scope covered
- **THEN** its directory holds one canonical document, one summary document, and evidence files only for content the canonical document cannot carry

#### Scenario: Derived view proposed as an artifact
- **WHEN** a proposed artifact renders or filters values the canonical document already carries
- **THEN** it is part of the summary document and is not indexed as a separate artifact

#### Scenario: Metrics outside the envelope
- **WHEN** a run reports metrics
- **THEN** they are carried by the return envelope and no metrics artifact is indexed
