# Foundation Contract Delta

## MODIFIED Requirements

### Requirement: Honest completion
A completed run SHALL have a non-empty stage artifact contract, valid artifacts, and SHALL distinguish workflow completion from verification outcome and release recommendation.

#### Scenario: Product defect found
- **WHEN** all planned verification work completes and a product assertion fails
- **THEN** workflow status is completed, verification outcome is fail, and the evidence is preserved

#### Scenario: Empty completion
- **WHEN** completion declares no required artifacts
- **THEN** finalization rejects the run

### Requirement: Finalized run identity
A finalized run SHALL NOT be silently replaced by reinitializing the same run ID.

#### Scenario: Existing control files
- **WHEN** create is called with a finalized run ID
- **THEN** creation fails and directs the caller to resume or fork

