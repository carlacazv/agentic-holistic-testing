## Context

Foundation provides browser resolution, permission gates, raw/durable separation, redaction, checksums, and statuses. Explore adds a structured but flexible session model.

## Goals / Non-Goals

**Goals:** auditable charters, notes, coverage, evidence, and reproducible defect drafts.

**Non-Goals:** claiming exhaustive coverage, publishing issues, penetration testing, or production mutations.

## Decisions

Use a normalized session object validated before rendering. Core CSV files capture notes, coverage, and evidence; each defect renders to `explore/defects/<id>/reproduction.md`. The agent selects heuristics such as SFDIPOT and FEW HICCUPPS and records rationale instead of following a rigid script. Evidence confidence is explicit.

## Risks / Trade-offs

- [Structure can constrain exploration] → Require only durable fields while allowing free-form observations and heuristic pivots.
- [Observations can be overstated] → Separate suspected/confirmed status, evidence confidence, and reproducibility.

## Migration Plan

Add session module, skill, schema, fixtures, tests, adapter entry, and docs; verify and archive.
