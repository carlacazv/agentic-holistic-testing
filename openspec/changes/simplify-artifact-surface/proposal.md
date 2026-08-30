## Why

The seven skills write 34 durable artifacts between them, and a large part of that surface carries no information the run does not already hold.

`plan` writes the same bundle shredded across six CSV files, while `review-plan` writes that same object whole as one JSON document. The plan therefore exists in two incompatible shapes, and a downstream skill has to know which stage produced the run before it can read the plan at all.

Four skills write a `metrics.json` that duplicates the `metrics` object `finalize` already places in the return envelope. Nothing compares the two, so the run can carry two disagreeing sets of numbers and stay valid.

`automation-strategy` writes `approved-playwright-candidates.json`, a filtered copy of rows already in the candidate matrix. `approvedPlaywrightCandidates` computes that same filter, so the copy is a second source of truth that can drift from the matrix it came from.

The rest are renderings. `plan/rationale.md`, `plan/test-data-prerequisites.md`, `explore/charter.md`, `accessibility/scope.md`, `accessibility/unresolved-criteria.csv`, `performance/scope.md`, and `performance/variability.md` each restate fields the validated document already carries; `variability.md` is one string under a heading. Each is indexed, checksummed, and validated at finalization as though it were independent evidence.

The cost is not disk. A reader opening a run has no single document to read, a downstream skill has no single document to consume, and every added file is one more place for the run to contradict itself.

## What Changes

- Declare one artifact shape for every skill: one canonical machine-readable document holding the validated content, one summary document rendering it for a reader, and evidence files only for content that cannot sit inside the document.
- Carry run metrics only in the return envelope, and stop writing the four `metrics.json` artifacts.
- Write the plan as one canonical document from both `plan` and `review-plan`, under the same name and the same shape, so a plan reads identically whether or not it was reviewed.
- Derive the approved Playwright candidate set from the strategy document on read instead of persisting a filtered copy.
- Fold renderings and derived views into each skill's summary document.
- Keep the per-defect reproduction folders, which are the deliverable rather than a rendering, and keep raw tool output under the ignored raw evidence directory as the foundation already requires.

Durable artifacts fall from 34 to 14 across the seven skills. A full pipeline run holds 8 skill artifacts and 8 control files instead of 17 and 8.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `foundation-contract`: adds the canonical artifact shape every skill returns, and places run metrics in the return envelope alone.
- `plan-skill`: returns one canonical plan document and one summary instead of six CSV collections, two rendered documents, and a metrics file.
- `review-plan-skill`: writes the improved plan in the same canonical form the plan skill writes, so downstream reads one shape.
- `automation-strategy-skill`: returns one strategy document whose approved candidate set is derived on read.
- `implement-playwright-skill`: carries findings and verification results inside the implementation document rather than beside it.
- `explore-skill`: carries the evidence index inside the session document.
- `accessibility-skill`: returns one audit document and one summary, with unresolved criteria derived rather than duplicated.
- `performance-skill`: returns one audit document and one summary, with evaluated budgets carried inside it.

## Impact

Affects the seven `src/stages/*.mjs` write functions and their `*_REQUIRED_ARTIFACTS` declarations, the seven `skills/holistic-qa/*/instructions.md` return sections, and the per-stage tests in `test/`.

This breaks any consumer reading `qa/runs/*/plan/*.csv` or a `metrics.json`. The package is private, unpublished, and listed in no provider marketplace, so the blast radius is runs already on disk: they stay readable and are not migrated.

CSV remains the foundation exchange encoding and `src/core/csv.mjs` is unchanged, but no skill writes a CSV artifact after this change. Tabular output returns as an on-demand export when the stage CLI lands; until then a reader who wants a spreadsheet has to convert the canonical document themselves.
