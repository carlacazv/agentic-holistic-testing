# Change: Operationalize cycle and runner evidence

## Why

The cycle can describe its next step but cannot yet persist, resume, complete, or summarize a workflow through the CLI. Playwright verification can also be declared without importing a real runner report.

## What Changes

- Add workspace diagnostics and durable cycle lifecycle commands.
- Import Playwright JSON reporter output into deterministic verification results.
- Validate the installed adapter and lifecycle from a clean consumer project.

## Impact

Affects the CLI, cycle workflow, Playwright stage, two skill instructions, README, and tests. Existing cycle-init and cycle-next commands remain supported.
