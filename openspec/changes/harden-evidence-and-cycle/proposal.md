# Change: Harden evidence and add an optional quality cycle

## Why

The runtime can currently accept declared results without proving that the corresponding work ran, and a completed run can be reopened with an empty in-memory index. These false-positive paths must be closed before the workflow is made easier to run autonomously.

People should also be able to start from a quality goal without knowing the individual skill names, while every skill remains independently callable.

## What Changes

- Require testable plan content and non-empty actions, expected results, acceptance criteria, and rationales.
- Bind Playwright verification to executable test source and preserve product failures as valid QA results.
- Require evidence for accessibility pass claims.
- Prove review modifications against the actual before/after diff.
- Prevent empty completed runs and accidental overwrite of finalized runs.
- Separate workflow completion, verification outcome, and release recommendation.
- Add optional `report` and `cycle` skills without changing independent skill invocation.

## Impact

This changes the foundation, plan, review, Playwright, accessibility, packaging, CLI, tests, and schemas. Existing schema-v1 documents remain readable; new outcome fields are optional in v1.

