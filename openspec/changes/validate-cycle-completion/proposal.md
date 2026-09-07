# Change: Validate cycle completion evidence

## Why

A real consumer benchmark showed that `cycle-start` fails when the output parent directory is absent and that `cycle-complete` accepts nonexistent, malformed, or wrong-skill run IDs. The latter allows a cycle to claim completion without checksum-valid evidence.

## What Changes

- Create missing parent directories before atomically writing cycle state.
- Validate the run ID, run directory, checksums, envelope run ID, and envelope skill before completing a step.
- Make the run-ID contract explicit in the cycle skill.

## Impact

Affects the CLI, cycle skill instructions, and CLI contract tests. Valid existing cycles remain compatible.
