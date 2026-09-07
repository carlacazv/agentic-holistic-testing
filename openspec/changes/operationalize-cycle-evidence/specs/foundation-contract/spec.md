## ADDED Requirements

### Requirement: Workspace diagnosis
The runtime SHALL diagnose its Node version, project manifest, Git worktree, and installed adapters before a broad workflow. It SHALL distinguish blocking failures from non-blocking warnings.

#### Scenario: Adapter is not installed
- **WHEN** doctor runs in an otherwise valid project without an adapter
- **THEN** it reports a warning rather than a blocking failure
