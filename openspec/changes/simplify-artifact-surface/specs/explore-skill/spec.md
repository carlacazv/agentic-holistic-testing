## MODIFIED Requirements

### Requirement: Evidence integrity
Evidence SHALL be indexed by stable ID, type, raw path, durable redacted path when promoted, checksum, confidence, and linked observations or defects. The index SHALL be carried inside the canonical session document, alongside the charter, the session notes, and the coverage notes, rather than as a separate artifact per collection.

#### Scenario: Sensitive browser evidence
- **WHEN** evidence contains credentials or tokens
- **THEN** raw evidence remains ignored and only a redacted durable copy is indexed for reporting

#### Scenario: Session is read as one document
- **WHEN** an exploratory run finalizes
- **THEN** the charter, notes, coverage, and evidence index are read from one canonical document and one summary, while each defect keeps its own reproduction folder
