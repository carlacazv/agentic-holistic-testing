# Design

## Result model

A run has three independent axes: workflow status, verification outcome, and release recommendation. Finding a product defect can therefore be a completed QA workflow whose verification failed and whose release recommendation is not ready.

## Evidence boundary

The model may propose content. Deterministic code validates structure, lineage, checksums, and actual runner output. Source inspection is a structural guard only; it never proves that assertions are meaningful.

## Run lifecycle

Creating a run fails when a finalized run with the same ID exists. Resume and fork are explicit operations. Finalization requires a non-empty declared artifact contract for completed work.

## Optional orchestration

`cycle` selects and sequences work from a goal. Direct calls to `plan`, `review-plan`, `automation-strategy`, `implement-playwright`, `explore`, `accessibility`, `performance`, or `report` continue to work. Explicit skill selection always limits the workflow to that skill and its declared prerequisites.

## Portable skill names

Generated Codex and Claude Code skills use the same hyphen-case frontmatter names. This keeps every skill independently callable and satisfies the current skill package validator.
