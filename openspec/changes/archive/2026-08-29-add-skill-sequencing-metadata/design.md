## Context

`skills/manifest.json` carries an id and a description per skill; the adapter renders those into provider-native `SKILL.md` frontmatter. The dependency chain between skills exists only as prose inside each instruction body. See `proposal.md` for why that is too late to be useful.

## Goals / Non-Goals

**Goals:** make the order machine-declared and visible at selection time; keep one source of truth for it; keep the ordering correct in each provider's own invocation naming.

**Non-Goals:** enforcing the order at runtime, orchestrating the chain, or validating that an upstream run actually exists - each skill already gates on checksum-valid upstream input and returns `blocked` without it.

## Decisions

The manifest declares `track` (`pipeline` or `audit`) and `requires`, and nothing else. Position is derived from the prerequisite chain rather than stored as a number, so an explicit order field can never disagree with the dependencies it is supposed to summarize.

The ordering is written into the `description`, not only into `metadata`. Provider runtimes select a skill from its description; metadata a runtime may ignore would leave the original problem in place. Metadata carries `track` and `requires` as well, for anything that reads structurally.

Prerequisites render through the same `frontmatterName` the adapter already uses per provider, so Codex reads `holistic-qa:plan` and Claude Code reads `holistic-qa-plan` in the same generated sentence. Hardcoding either would make one provider's text wrong.

The index is named `holistic-qa-README.md` and sits beside the manifest at the provider root rather than as a bare `README.md` inside the skills directory. A generic README there would appear to document every skill the user has installed, not only these.

Skill bodies are untouched, so `source_checksum` values do not move and the checksum drift check keeps its meaning across this change.

## Risks / Trade-offs

- [A description prefix consumes selection-prompt budget on every skill] → One sentence per skill, and it carries the prerequisite that prevents a wasted invocation, which costs more than the sentence.
- [The declared order can drift from what the instruction bodies actually require] → Packaging rejects unknown prerequisites, prerequisites on audit skills, and cycles, so drift fails the build rather than shipping.
- [An index file in the user's provider directory is one more artifact to keep current] → It is generated on every install from the same manifest, so re-running the install command refreshes it.

## Migration Plan

Add `track` and `requires` to the manifest, derive positions and render them in the adapter, emit the index, extend the adapter tests to cover both providers' naming and the failure modes, then run full validation twice.
