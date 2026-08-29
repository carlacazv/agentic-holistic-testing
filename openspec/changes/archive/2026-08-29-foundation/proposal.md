## Why

Holistic QA needs a provider-neutral, safety-first runtime contract before individual skills can exchange artifacts or make defensible completion claims. Establishing the shared contract first prevents later skills from inventing incompatible IDs, schemas, permissions, evidence handling, and return semantics.

## What Changes

- Add a provider-neutral Node.js core with no runtime dependencies.
- Define durable and raw-evidence storage boundaries by run ID.
- Define stable identifiers, canonical CSV encoding, SHA-256 checksums, redaction, JSON Schema validation, and artifact-index validation.
- Classify environments and enforce guided/autonomous permission gates, production read-only safeguards, and credential references.
- Define the shared return envelope and explicit `completed`, `partial`, `blocked`, and `failed` behavior.
- Add a Codex packaging adapter generated from shared skill sources and preserve a provider-adapter boundary for a phase-2 Claude Code package.
- Define optional pinned Playwright MCP integration with browser-tool and CLI fallbacks.
- Add deterministic tests and fixture scenarios for the foundation contract.

## Capabilities

### New Capabilities

- `foundation-contract`: Shared runtime, safety, storage, validation, adapter, and return-envelope behavior used by every holistic QA skill.

### Modified Capabilities

None.

## Impact

This creates the package structure, schemas, core library, CLI validation surface, Codex adapter build pipeline, test fixtures, and continuous-integration baseline. Later skills depend on these contracts; changing them after adoption requires a new foundation change and coordinated compatibility work. A Claude Code distribution is deferred to phase 2 and is not a v1 delivery claim.
