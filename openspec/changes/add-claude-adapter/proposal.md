## Why

The foundation contract already reserves the provider-adapter boundary for a phase-2 Claude Code package, and the runtime now has seven proven, checksum-verified skills built against the v1 Codex adapter. Holistic QA cannot reach Claude Code users while only one provider layout exists, and every capability that depends on the adapter boundary is otherwise ready for a second provider.

## What Changes

- Add a Claude Code provider target to the packaging adapter that generates a `.claude/skills/holistic-qa-<id>/SKILL.md` installation layout from the same provider-neutral skill sources used by the Codex adapter.
- Verify each generated Claude Code skill body against its provider-neutral source checksum, matching the existing Codex verification pattern.
- Add a `build:claude` script and extend adapter validation to check both providers before either is claimed as supported.
- Update the foundation documentation to state that Codex and Claude Code are both supported v1 adapters rather than describing Claude Code as a deferred phase-2 concern.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `foundation-contract`: The "Provider-neutral core with Codex packaging" requirement changes to cover both the Codex and Claude Code adapters, since the runtime now packages a second provider layout from the same skill sources.

## Impact

Affects `scripts/build-adapter.mjs`, `package.json` scripts, `test/adapter.test.mjs`, and `README.md`. No provider-neutral skill source, schema, or per-skill capability changes; the skill semantics stay exactly as each capability already declares them.
