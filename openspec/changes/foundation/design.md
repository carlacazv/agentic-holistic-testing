## Context

The repository contains only OpenSpec bootstrap files. The foundation must remain installable in a clean Codex environment, keep its core independent from provider-specific runtime APIs, and protect evidence that may contain credentials or production data. See `proposal.md` for motivation and `specs/foundation-contract/spec.md` for observable behavior. Claude Code packaging is a phase-2 concern.

## Goals / Non-Goals

**Goals:**

- Make shared contracts executable through deterministic library and CLI validation.
- Keep core behavior independent from agent provider and browser transport.
- Make unsafe environment, path, permission, or completion claims fail closed.
- Generate the Codex layout from one semantic source and prove source/output consistency.
- Support Node.js 22 using only built-in runtime modules.

**Non-Goals:**

- Execute any domain-specific QA stage.
- Publish packages or marketplace listings.
- Generate or validate the phase-2 Claude Code distribution.
- Store credential values or sanitize raw evidence in place.
- Implement mobile, desktop, security penetration, or backend load testing.

## Decisions

### Use a small ESM core and JSON CLI

The project will expose focused ESM modules under `src/core/` and a `holistic-qa` CLI that reads and writes JSON. Node.js 22 provides cryptography, filesystem, path, and test primitives without runtime dependencies. A framework was rejected because the contracts are small and dependency-free installation reduces supply-chain and adapter risk.

### Publish schemas and use repository-owned validators

Versioned JSON Schemas under `schemas/v1/` document machine contracts. Runtime validators are explicit functions selected by exact schema identifier; they collect all known failures and never fetch remote schemas. A general-purpose schema engine was rejected for the foundation because only repository-owned contracts are allowed and explicit validators keep the runtime dependency-free. Schema fixtures will prove the validators and published schemas agree on required fields, enumerations, formats, and additional-property behavior.

### Make the run store the trust boundary

`RunStore` owns validated run IDs, durable/raw roots, safe path resolution, artifact registration, redaction promotion, and finalization. All indexed paths are POSIX-style relative paths beneath the durable run directory. Finalization recomputes bytes and checksums from disk, sorts entries by path, writes the artifact index atomically, then writes the envelope atomically. A generic workspace writer was rejected because it would distribute path and completion checks across skills.

### Separate raw evidence from durable artifacts

Raw evidence remains in ignored `test-results/<run-id>/`. Promotion creates a redacted durable copy; it never rewrites the raw source. This preserves diagnostic fidelity while keeping versionable artifacts safe. Binary raw evidence is not promoted automatically because textual redaction cannot make it safe.

### Use content-derived IDs and explicit run IDs

Domain IDs use a normalized type prefix plus the first 16 hexadecimal characters of SHA-256 over canonical JSON. Generated run IDs combine UTC time, random bytes, and the `run-` prefix; callers may supply only identifiers matching the safe grammar. Purely sequential IDs were rejected because independently composed stages can collide.

### Enforce capabilities before transports

Environment and permission validation produces an allow/deny decision before a browser, CLI, or external service is called. Capability declarations include a `state_changing` flag. Production categorically rejects such capabilities and otherwise requires both production authorization and capability authorization. Credential references contain provider and key identifiers only; a schema rejects likely secret-value fields.

### Resolve browsers by declared capability

Browser resolution consumes an availability declaration and chooses pinned Playwright MCP, provider browser tool, then Playwright CLI. The checked-in integration manifest records an exact MCP package version and does not install it automatically. Resolution metadata is durable so fallback coverage is visible.

### Generate the Codex adapter from normalized skill sources

Provider-neutral sources live under `skills/holistic-qa/<skill>/`. The v1 adapter build adds only Codex metadata and invocation text, then writes a Codex `.agents/skills/` layout. It records a checksum of the normalized semantic body in its manifest. Validation rebuilds into a temporary directory and compares the source and output checksums. Adapter code is isolated behind a provider interface so phase 2 can add Claude Code without changing the core or skill bodies. Maintaining a handwritten Codex copy was rejected because drift would be hard to detect in review.

## Risks / Trade-offs

- [Explicit validators could diverge from JSON Schemas] → Use shared constants, positive and negative fixtures, and a schema-consistency test for every contract.
- [Redaction cannot guarantee arbitrary secrets are detected] → Support caller-supplied secret values, cover common credential structures, keep raw evidence ignored, and report redaction counts and residual risk.
- [Lexical path checks can miss symlink escapes] → Reject symbolic-link parents and verify real parent paths before writing or indexing.
- [Content-derived IDs can collide after truncation] → Use 64 bits of SHA-256 and detect duplicate IDs with differing canonical content within each run.
- [The future Claude adapter could expose hidden provider coupling] → Keep runtime calls out of skill semantics, isolate the Codex renderer, and require phase-2 contract tests before claiming Claude support.
- [No automatic MCP installation means browser setup may be absent] → Return an explicit blocked/partial result and provide browser-tool and CLI fallbacks.

## Migration Plan

There is no prior runtime to migrate. Introduce the package and CI on the foundation branch, validate the Codex adapter layout in a temporary clean home, then archive the OpenSpec change into the permanent capability specification. Rollback is removal of the foundation commit before dependent skill changes are merged.
