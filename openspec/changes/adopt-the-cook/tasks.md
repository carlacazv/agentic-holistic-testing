## 1. Configuration

- [x] 1.1 Pin Cook 13.0.0 and seed the shared layout without replacing AGENTS.md.
- [x] 1.2 Define contributor permissions and connect both Codex and Claude Code.
- [x] 1.3 Add Mise maintenance tasks, a CI drift gate, and documentation.

## 2. Symlink scanning

- [x] 2.1 Inspect symlink text instead of following targets.
- [x] 2.2 Add regression coverage for directory, external, and dangling links and regular-file credential detection.

## 3. Verification

- [x] 3.1 Verify recipe idempotence, committed links, and policy drift detection.
- [x] 3.2 Run the full repository validation pipeline and record results.

Validation: `npm run validate` passed with 94 Node tests, 9 Playwright executions, a Lighthouse/API fixture, adapter checks, documentation, schemas, OpenSpec, and contamination scanning. `mise run validate:cook` and a repeated `cook:plan` passed. An uncooked temporary permission change made `cook check` exit 1 and left generated files unchanged; the original policy was restored.
