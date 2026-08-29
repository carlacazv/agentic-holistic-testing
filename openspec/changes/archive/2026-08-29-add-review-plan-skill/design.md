## Context

The plan module already exposes deterministic validation and metrics. Review-plan must compare immutable before input with a separately validated after bundle and make every claimed improvement auditable.

## Goals / Non-Goals

**Goals:** measurable improvement, exact modifications, checksum integrity, and seeded-defect proof.

**Non-Goals:** executing the plan, changing requirements, or publishing review findings externally.

## Decisions

`reviewPlan` will accept before/after bundles plus findings and modifications, compute both validation reports and metrics, checksum canonical bundles, enforce finding/modification links, and reject an invalid after bundle or metric regression. Rendering produces JSON and CSV artifacts. Agent instructions own semantic critique; deterministic code owns integrity and measurable claims.

## Risks / Trade-offs

- [Metrics can be gamed by low-value cases] → Require findings, exact modifications, technique review, and no-regression checks rather than coverage percentage alone.
- [Review can overwrite source evidence] → Treat before data as immutable and write the improved bundle separately.

## Migration Plan

Add the module, schema, skill, fixture, and tests, verify the Codex adapter, then archive the new capability.
