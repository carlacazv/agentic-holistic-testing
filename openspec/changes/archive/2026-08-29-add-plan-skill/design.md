## Context

The archived foundation provides stable IDs, CSV encoding, run storage, schemas, checksums, status semantics, and Codex adapter generation. The plan capability is the first skill to define a domain artifact bundle on top of that contract.

## Goals / Non-Goals

**Goals:**

- Make traceability completeness and risk priority mechanically verifiable.
- Preserve expert planning judgment while requiring explicit rationale.
- Produce files that downstream review and automation skills can consume without prose parsing.

**Non-Goals:**

- Generate automation code, execute tests, create test data, or publish findings.
- Infer business acceptance where authoritative behavior is absent.

## Decisions

### Validate a normalized bundle, not generated prose

`src/stages/plan.mjs` will validate a JSON bundle and calculate coverage metrics and priorities. The Codex skill guides analysis and writes canonical CSV/Markdown artifacts through the foundation runtime. A fully automatic case generator was rejected because requirement shapes and domain semantics need agent judgment; deterministic validation catches omissions without pretending to replace that judgment.

### Use link tables and explicit dispositions

Requirements, risks, cases, and steps remain separate records joined by two-column link tables. Uncovered items carry one of four controlled dispositions and rationale. Embedded comma-separated IDs were rejected because they are harder to validate and diff.

### Encode technique selection per test

Each test case records a controlled technique plus rationale; plan-level heuristic rationale records SFDIPOT and FEW HICCUPPS selection. Strict three-point boundary coverage is validated from case metadata containing boundary role and value.

### Keep the bundle consumable before rendering

The stage module returns validation errors, computed risks, and metrics from plain data. Rendering uses foundation CSV functions and deterministic column definitions. Downstream skills consume these files and the metrics JSON rather than the agent transcript.

## Risks / Trade-offs

- [A structurally complete plan can still be semantically weak] → Require technique rationale, risk links, exploratory heuristics, and later `review-plan` evaluation.
- [Pairwise reduction could hide critical combinations] → Require a rationale and retain full decision tables for deterministic business rules.
- [Source IDs can be inconsistent] → Preserve source IDs as metadata while using stable normalized IDs for links.

## Migration Plan

Add the plan contract, module, source skill, fixtures, and tests; build and validate the Codex adapter; then archive the capability. No existing consumer migration is required.
