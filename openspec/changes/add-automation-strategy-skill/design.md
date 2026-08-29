## Context

Plan supplies normalized case IDs, risks, techniques, and traceability. This capability adds a decision layer but must not generate code before explicit approval.

## Goals / Non-Goals

**Goals:** complete per-case decisions, push-down recommendations, Playwright suitability, and approval-gated output.

**Non-Goals:** implementing tests, changing plan scope, or treating E2E as the default.

## Decisions

The module uses ordered suitability flags to calculate the lowest effective level and validates each supplied recommendation. It records 1–5 impact, stability, and cost independently rather than collapsing them into an opaque score. `approved` is a separate boolean from `decision`; downstream selection requires automate + approved + API/E2E.

## Risks / Trade-offs

- [Suitability flags oversimplify architecture] → Skill instructions require evidence and rationale; validation ensures consistency, not the semantic judgment itself.
- [Push-down loses user-visible confidence] → Browser-only risks make lower suitability false and preserve E2E.

## Migration Plan

Add module, schema, skill, fixtures, tests, and adapter entry, then archive after repeated validation.
