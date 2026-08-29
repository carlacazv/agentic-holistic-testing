## 1. Claude Code Adapter

- [x] 1.1 Implement `buildAdapter("claude", outputRoot)` writing `.claude/skills/holistic-qa-<id>/SKILL.md` per declared skill with `name: holistic-qa-<id>`, `description`, and `metadata.provider: claude` / `metadata.source_checksum`, reusing the existing manifest loader, `normalizeBody`, and checksum helpers; verify it emits one file per manifest skill with a matching checksum.
- [x] 1.2 Write the Claude provider's own `.holistic-qa-manifest.json` at its output root and verify `buildAdapter("claude", ...)` returns the same shape as the Codex result (`provider`, sorted `skills` with `id`/`source_checksum`).

## 2. Wiring and Verification

- [x] 2.1 Add `build:claude` to `package.json` and extend `validate:adapter` to run both providers' `--check` mode; verify both commands succeed from a clean checkout.
- [x] 2.2 Extend `test/adapter.test.mjs` to build the Claude provider in a temporary directory and assert its skill count, file layout, and checksum-embedded frontmatter, alongside the existing Codex assertions.
- [x] 2.3 Update `README.md` and the `foundation-contract` requirement's supporting docs to describe Claude Code as a supported v1 adapter; verify `npm run validate` passes twice in a row.
