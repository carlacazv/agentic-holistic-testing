## MODIFIED Requirements

### Requirement: Provider-neutral core with Codex packaging
The runtime and skill sources SHALL remain independent of provider runtime APIs. The v1 distribution SHALL generate both a Codex installation layout and a Claude Code installation layout from the same provider-neutral skill sources, and the adapter interface SHALL isolate supported metadata, invocation syntax, and installation layout per provider so neither adapter changes skill semantics.

#### Scenario: Codex package is built
- **WHEN** the packaging command runs in a clean checkout
- **THEN** it emits an installable Codex layout for every declared skill and validates each generated body against its provider-neutral source checksum

#### Scenario: Claude Code package is built
- **WHEN** the packaging command runs for the Claude Code provider in a clean checkout
- **THEN** it emits an installable Claude Code layout for every declared skill and validates each generated body against its provider-neutral source checksum

#### Scenario: Provider metadata and invocation stay isolated
- **WHEN** the same declared skill is packaged for both providers
- **THEN** each provider's generated layout uses only that provider's supported metadata fields and invocation name, and neither adapter's output leaks the other provider's format
