## Context

`scripts/build-adapter.mjs` already isolates a provider adapter behind `buildAdapter(provider, outputRoot)`. Today only `"codex"` is implemented: it reads `skills/manifest.json`, normalizes each skill's `skills/holistic-qa/<id>/instructions.md` body, checksums it, and writes `.agents/skills/holistic-qa-<id>/SKILL.md` plus a top-level `.holistic-qa-manifest.json`. See `proposal.md` for why a second provider is being added now.

## Goals / Non-Goals

**Goals:**
- A `"claude"` provider that reuses the exact same normalized skill bodies and checksum verification as the Codex provider, so the two adapters can never drift from the shared source.
- A distinct Claude Code installation layout and invocation name, proving the adapter boundary actually isolates provider-specific concerns rather than hard-coding Codex assumptions.
- `validate:adapter` checks both providers, so neither can silently regress.

**Non-Goals:**
- Publishing to any Claude Code marketplace or registry.
- Changing any provider-neutral skill instruction body, schema, or per-skill capability.
- A generic N-provider plugin system; two concrete providers is enough to prove the boundary holds.

## Decisions

- **Output layout**: `<outputRoot>/.claude/skills/holistic-qa-<id>/SKILL.md`, mirroring the existing `.agents/skills/holistic-qa-<id>/SKILL.md` Codex layout one directory root over. Rejected a shared top-level skills directory for both providers because Claude Code and Codex resolve installed skills from different root names; keeping them separate is what "isolate installation layout" in the foundation contract already requires.
- **Invocation name**: Claude Code skills use the bare id, `holistic-qa-<id>` (matching this project's own `.claude/skills/<id>/SKILL.md` bootstrap skills), instead of Codex's colon-namespaced `holistic-qa:<id>`. This is a real, deliberate difference in "invocation syntax" between adapters, not an oversight — each provider's naming convention is followed on its own terms.
- **Frontmatter shape**: `name`, `description`, `metadata.provider`, `metadata.source_checksum` - the same four fields Codex already writes, with `provider: claude` instead of `provider: codex`. Rejected adding Claude-specific frontmatter fields (e.g. `allowed-tools`) because no declared holistic-qa skill needs elevated tool permissions yet; a later skill that does can extend the adapter without revisiting this design.
- **Shared normalization**: both providers call the same `normalizeBody` + `checksum` helpers already used by the Codex path, so `source_checksum` is comparable across providers and both fail the same way on a mismatched body.
- **CLI surface**: `buildAdapter(provider, outputRoot)` gains a second branch; `node scripts/build-adapter.mjs claude [--check]` works exactly like the existing `codex` invocation. `package.json` gains `build:claude`, and `validate:adapter` runs both providers' `--check` mode in sequence so CI catches a regression in either one.

## Risks / Trade-offs

- [A hand-maintained second adapter could drift from the Codex one over time] → Both branches share the same manifest loader, `normalizeBody`, and checksum helpers; only the output path and frontmatter differ, keeping the duplicated surface small and reviewable.
- [Claiming "Claude Code support" without a real distribution channel could overstate readiness] → Scope this change to the installable layout and checksum verification only; docs state what is generated and validated, not that a marketplace listing exists.

## Migration Plan

Add the `claude` branch to `buildAdapter`, the `build:claude` script, extend `validate:adapter`, update `test/adapter.test.mjs` to cover both providers, update `README.md` and the foundation-contract requirement to describe Claude Code as supported. Run `npm run validate` twice before considering the change ready to archive.
