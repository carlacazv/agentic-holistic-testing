# Foundation Contract Specification

## Purpose

Defines the interoperable artifact, validation, permission, evidence, safety, and packaging contract required by every holistic QA skill and provider adapter.

## Requirements

### Requirement: Shared return envelope
Every skill invocation SHALL return schema version 1 with a run ID, skill name, one of `completed`, `partial`, `blocked`, or `failed`, and arrays for inputs, artifacts, gaps, residual risks, approvals, errors, and next actions. It SHALL include a metrics object. Each artifact entry SHALL identify its type, durable path, media type, SHA-256 checksum, and generation status. Each error SHALL state whether it is recoverable and identify the missing input or permission when one can unblock it.

#### Scenario: Valid completed return
- **WHEN** a skill finishes its declared scope and all referenced artifacts validate
- **THEN** it returns `completed` with a schema-valid envelope and checksum-valid artifact entries

#### Scenario: Valid incomplete return
- **WHEN** a skill produces valid artifacts but cannot cover part of its declared scope
- **THEN** it returns `partial` and records the uncovered scope in gaps and residual risks

#### Scenario: Missing prerequisite
- **WHEN** a required capability, environment, test datum, credential reference, or authorization is unavailable before useful work can proceed
- **THEN** the skill returns `blocked` with a recoverable error and an explicit unblocking action

### Requirement: Stable run and record identifiers
The runtime SHALL accept user-supplied run IDs only when they are safe lowercase identifiers and SHALL otherwise generate sortable, collision-resistant run IDs. Artifact records and domain records SHALL use deterministic prefixed identifiers when the same canonical inputs are supplied.

#### Scenario: Equivalent canonical input
- **WHEN** the same record type and canonical input values are used more than once
- **THEN** the generated stable identifier is identical each time

#### Scenario: Unsafe run identifier
- **WHEN** a supplied run ID contains path traversal, uppercase characters, whitespace, or shell metacharacters
- **THEN** validation rejects it before any run directory is created

### Requirement: Durable and raw evidence isolation
The runtime SHALL store durable artifacts under `qa/runs/<run-id>/` and raw or potentially sensitive evidence under ignored `test-results/<run-id>/`. Durable artifact paths SHALL remain inside the run directory after path resolution.

#### Scenario: Run initialization
- **WHEN** a validated run is initialized
- **THEN** the durable and raw evidence directories are created at their declared isolated locations

#### Scenario: Artifact path escape
- **WHEN** an artifact path resolves outside `qa/runs/<run-id>/`
- **THEN** the runtime rejects the artifact and does not index it

### Requirement: Canonical CSV exchange
CSV helpers SHALL encode RFC 4180-compatible rows using UTF-8, CRLF row endings, a declared column order, a single header row, and correct quoting for commas, quotes, and line breaks. Parsing SHALL reject duplicate headers, inconsistent row widths, and undeclared columns when strict mode is enabled.

#### Scenario: CSV round trip
- **WHEN** values contain commas, quotes, CRLF, empty strings, and Unicode
- **THEN** serialization and parsing preserve the values and declared column order

#### Scenario: Malformed CSV
- **WHEN** a row has a different field count from its header
- **THEN** strict parsing fails with a row-specific validation error

### Requirement: Checksummed artifact index
Every skill-generated durable artifact SHALL be indexed with its relative path, media type, generation status, byte size, and lowercase SHA-256 checksum. The artifact index and return envelope are validated control files and SHALL NOT index themselves. Validation SHALL reject missing files, paths outside the run, checksum mismatches, duplicate paths, and generated artifacts without a checksum.

#### Scenario: Tampered artifact
- **WHEN** an indexed artifact changes after its checksum was recorded
- **THEN** artifact validation reports the exact path and checksum mismatch

### Requirement: Schema validation
Machine-readable contracts SHALL have versioned JSON Schemas. The CLI SHALL validate documents against only repository-owned schema identifiers and SHALL report all detectable validation failures with instance paths.

#### Scenario: Invalid envelope
- **WHEN** a return envelope omits a required field or uses an unknown status
- **THEN** validation fails non-zero and identifies the invalid field

### Requirement: Evidence redaction
Before text evidence becomes durable, the runtime SHALL redact configured secret values and common credentials, authorization headers, cookies, private keys, and token-bearing URL parameters. Redaction SHALL preserve enough surrounding structure for diagnosis and SHALL report the number of replacements without revealing matched values.

#### Scenario: Sensitive text is promoted
- **WHEN** raw evidence includes bearer tokens, cookies, API keys, credentials, or configured secret values
- **THEN** the durable copy replaces each sensitive value with a typed redaction marker and reports a replacement count

### Requirement: Environment classification and permissions
Each run SHALL classify its target as `local`, `development`, `test`, `staging`, or `production`, declare `guided` or `autonomous` mode, and evaluate explicit capabilities before execution. Credentials SHALL be represented by references rather than stored values. Guided mode SHALL require recorded approval for state-changing capabilities. Autonomous mode SHALL permit only pre-authorized capabilities.

#### Scenario: Guided state change without approval
- **WHEN** guided execution requests a state-changing capability without a matching approval
- **THEN** the permission gate denies execution and returns the approval needed

#### Scenario: Autonomous capability outside allowlist
- **WHEN** autonomous execution requests a capability not present in its pre-authorized allowlist
- **THEN** the permission gate denies execution before an external action occurs

### Requirement: Production safeguards
Production SHALL be disabled by default. A production run SHALL require explicit production authorization, SHALL reject all state-changing capabilities, and SHALL allow only separately authorized read-only checks.

#### Scenario: Production mutation request
- **WHEN** any production run requests a capability classified as state-changing
- **THEN** the gate denies it even when the run has general production authorization

#### Scenario: Production read-only request
- **WHEN** a production run has explicit production and read-only capability authorization
- **THEN** the gate allows only the authorized read-only check

### Requirement: Browser capability resolution
Browser-backed skills SHALL resolve browser execution in this order: configured Playwright MCP, an available provider browser tool, then Playwright CLI. An MCP configuration SHALL pin an exact package version. If no compatible capability is available, the skill SHALL return `blocked` or `partial` according to whether other valid scope was completed.

#### Scenario: Preferred browser unavailable
- **WHEN** the pinned Playwright MCP is unavailable but a declared browser tool is available
- **THEN** resolution selects the browser tool and records the fallback in run metadata

#### Scenario: No browser capability
- **WHEN** browser coverage is required and no declared browser mechanism is available
- **THEN** the skill does not silently omit browser coverage and records the gap with a blocking or partial status

### Requirement: Provider-neutral core with Codex packaging
The runtime and skill sources SHALL remain independent of provider runtime APIs. The v1 distribution SHALL generate a Codex installation layout from provider-neutral skill sources, and the adapter interface SHALL isolate supported metadata, invocation syntax, and installation layout so a Claude Code adapter can be added without changing skill semantics.

#### Scenario: Codex package is built
- **WHEN** the packaging command runs in a clean checkout
- **THEN** it emits an installable Codex layout for every declared skill and validates each generated body against its provider-neutral source checksum

### Requirement: Run finalization
Finalization SHALL validate every durable artifact, write a deterministic artifact index, and write the shared return envelope only after referenced artifacts exist. It SHALL prevent a `completed` status when required artifacts are absent or invalid.

#### Scenario: Required artifact missing at finalization
- **WHEN** a skill requests `completed` but a required artifact was not generated
- **THEN** finalization rejects the completion claim and reports the missing artifact
