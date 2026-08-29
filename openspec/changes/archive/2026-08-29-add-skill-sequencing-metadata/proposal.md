## Why

Installing the skills drops seven sibling directories into a provider's skills folder with nothing stating how they relate. The chain is real - `review-plan` needs a plan run, `implement-playwright` needs approved candidates - but it is written inside each instruction body, which an agent only reads after it has already chosen the skill. At the moment of selection, and to a person opening the folder, the seven look interchangeable.

## What Changes

- Declare per skill in the manifest whether it belongs to the ordered pipeline or is an independent audit, and which skills must complete first.
- State each skill's pipeline position and prerequisites in its generated description and metadata, in that provider's invocation naming, so the ordering is visible where the selection decision is made.
- Ship an index document in every generated provider layout listing the pipeline in order and the independent audits separately.
- Fail packaging when a declared prerequisite is unknown, an audit declares prerequisites, or the prerequisite chain is cyclic.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `foundation-contract`: adds a skill-sequencing requirement covering the manifest declaration, its surfacing in generated skills, and the index document each installed layout ships.

## Impact

Affects `skills/manifest.json`, `scripts/build-adapter.mjs`, and `test/adapter.test.mjs`. Every generated `SKILL.md` gains a description prefix plus `track` and `requires` metadata, and each provider layout gains a `holistic-qa-README.md`. Skill bodies and their source checksums are unchanged, so no instruction content moves.
