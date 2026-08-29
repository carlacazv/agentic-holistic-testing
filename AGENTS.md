# Repository instructions

## Project

Holistic QA is a provider-neutral Node.js runtime and skill distribution for
Codex and Claude Code. The runtime is offline-first and keeps QA evidence
traceable, checksummed, permission-gated, and explicit about incomplete
coverage.

## Toolchain

- Use Node.js 22 or newer.
- Use the public npm registry configured by `.npmrc`.
- Prefer Mise tasks when available; equivalent npm scripts are documented in
  `package.json`.
- Keep generated adapter output under `dist/`; it is build output and should
  not be committed.

## Validation

Before declaring a change complete, run the narrowest relevant checks and then
the full validation when practical:

```sh
npm test
npm run validate
```

For adapter work, also run:

```sh
npm run build:codex
npm run build:claude
npm run validate:adapter
```

OpenSpec artifacts must remain valid and all required tasks must be reflected
in their change files.

## Change guidelines

- Preserve provider-neutral behavior in `skills/holistic-qa/`; put provider
  differences in the adapter builder.
- Preserve deterministic JSON, checksums, path isolation, redaction, and
  permission gates.
- Do not add credentials, private keys, private registry URLs, or external
  organization-specific references.
- Do not publish packages or perform external state-changing QA actions unless
  the user explicitly requests and approves them.
- Keep tests focused on observable behavior and update documentation when the
  supported workflow changes.

## Repository workflow

- Work directly on the requested branch only when the user explicitly asks.
- Preserve unrelated working-tree changes.
- Use focused, behavior-oriented commits with clear messages.
- Inspect `git status` before staging, and verify the final diff and tests
  before committing or pushing.
