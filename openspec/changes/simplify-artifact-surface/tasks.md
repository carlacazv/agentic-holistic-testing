## 1. Canonical shape

- [x] 1.1 Extract the markdown table helpers already in `src/stages/review-plan.mjs` into a shared `src/core/markdown.mjs` and export it from `src/index.mjs`, so every summary document renders tables the same way; verify a value containing a pipe, a newline, and an empty cell survives rendering.
- [x] 1.2 Stop writing a metrics artifact in `plan`, `automation-strategy`, `accessibility`, and `performance`, keeping each metric function as the value passed to `finalize({ metrics })`; verify each skill's envelope still carries the same metric values and no `metrics.json` is indexed.

## 2. Pipeline skills

- [x] 2.1 Replace the six plan CSV artifacts and the two rendered documents with `plan/plan.json` holding the validated bundle and `plan/summary.md` rendering requirements, risks, cases with their steps, dispositions with rationale, test-data prerequisites, technique and heuristic rationale, and coverage; verify `PLAN_REQUIRED_ARTIFACTS` names two paths and a finalized run indexes exactly those two.
- [x] 2.2 Write the improved bundle as `review-plan/plan.json` and the review document as `review-plan/summary.md`, keeping `reviewMarkdown` as the renderer; verify a reviewed run and a plan run produce a document of the same shape under the same name.
- [x] 2.3 Replace the strategy matrix, approved candidate file, and metrics file with `automation-strategy/strategy.json` holding every assessed row and `automation-strategy/summary.md`; verify `approvedPlaywrightCandidates` derives the approved set from the written document and that correcting a row's approval changes the derived set with no second file to update.
- [x] 2.4 Replace the manifest, findings, and verification artifacts with `implement-playwright/implementation.json` carrying findings and verification results as fields, plus `implement-playwright/summary.md` naming each spec, its candidates, its locator evidence, and the verification outcome; verify `validatePlaywrightImplementation` is unchanged in what it rejects and that inferred-locator files still surface as gaps.

## 3. Audit skills

- [x] 3.1 Replace the explore charter, notes, coverage, and evidence artifacts with `explore/session.json` and `explore/summary.md`, keeping one `explore/defects/<defect-id>/reproduction.md` per defect; verify `explorationRequiredArtifacts` returns two paths plus one folder per defect.
- [x] 3.2 Replace the accessibility scope, axe, manual, evidence, unresolved, and metrics artifacts with `accessibility/audit.json` and `accessibility/summary.md`, deriving the unresolved criteria for the summary rather than writing them separately, and keeping one draft per defect; verify an audit with unresolved checks reports them in the summary and indexes no unresolved artifact.
- [x] 3.3 Replace the performance scope, budgets, Lighthouse, API, variability, regressions, and metrics artifacts with `performance/audit.json` carrying the evaluated budgets and the API timing summaries, plus `performance/summary.md`, keeping one draft per defect; verify a failed budget still reports threshold, actual, direction, and its linked defect, and that baseline mode still states SLA uncertainty.

## 4. Instructions and validation

- [x] 4.1 Update the Return section of the seven `skills/holistic-qa/*/instructions.md` to name the canonical document, the summary, and the evidence each skill returns, and remove every reference to a removed artifact; verify no instruction body names a path the runtime no longer writes.
- [x] 4.2 Update `README.md` where it describes run output so the durable tree shows the canonical shape; verify the described tree matches a real finalized run.
- [x] 4.3 Run the full validation from a clean checkout after rebuilding both provider layouts; verify `npm run validate` passes twice in a row and `npm run build:codex && npm run build:claude && npm run validate:adapter` succeeds.
