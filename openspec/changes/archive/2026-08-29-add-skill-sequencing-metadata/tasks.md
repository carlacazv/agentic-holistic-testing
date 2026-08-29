## 1. Declaration and Rendering

- [x] 1.1 Add `track` and `requires` to every skill in `skills/manifest.json`, and reject an unknown prerequisite, a prerequisite on an audit skill, and a cyclic chain at manifest load; verify packaging fails for each.
- [x] 1.2 Derive each pipeline skill's position from its prerequisite chain and render position plus prerequisites into the generated description and `track`/`requires` metadata, using each provider's invocation naming; verify a Claude Code build reads `holistic-qa-plan` and a Codex build reads `holistic-qa:plan` in the same sentence.

## 2. Installed Index

- [x] 2.1 Write `holistic-qa-README.md` into each provider root listing the pipeline in order and the audits separately; verify both providers emit it with their own invocation naming and that installing both into one target leaves each index intact.
- [x] 2.2 Confirm skill bodies and source checksums are unchanged by this change and run full validation twice.

## 3. Specification

- [x] 3.1 Sync the delta into `openspec/specs/foundation-contract/spec.md` and archive the change; verify strict OpenSpec validation of active and archived artifacts.
