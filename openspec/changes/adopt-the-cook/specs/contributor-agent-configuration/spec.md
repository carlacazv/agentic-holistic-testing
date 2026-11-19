## ADDED Requirements

### Requirement: Reproducible shared contributor configuration

The repository SHALL pin the Cook engine and recipe versions and commit shared permission sources, rendered Codex and Claude settings, and relative harness links while preserving existing repository instructions and skills.

#### Scenario: Fresh checkout

- **WHEN** a contributor clones with symlink support
- **THEN** both harnesses can read the committed shared setup without running Cook

### Requirement: Configuration drift gate

The repository SHALL provide preview, apply, and validation tasks and a CI check that fails when recorded recipes would change committed configuration.

#### Scenario: Uncooked policy change

- **WHEN** a permission source changes without regenerating native settings
- **THEN** Cook validation exits unsuccessfully without writing files

### Requirement: Scan Git symlink content

The contamination scanner SHALL inspect a versioned symlink's text without following its target and SHALL continue detecting credentials in regular repository files.

#### Scenario: Directory and external links

- **WHEN** a repository contains directory, external, or dangling symlinks
- **THEN** scanning succeeds without reading their targets

#### Scenario: Credential in a regular file

- **WHEN** a regular repository file contains a credential-like token
- **THEN** scanning fails and identifies that file
