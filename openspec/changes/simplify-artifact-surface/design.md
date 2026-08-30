## Context

Nothing here changes what a skill decides, validates, or refuses. Every validator keeps its rules, every metric keeps its formula. The decision is only which of those results deserve to be a separate checksummed file, and the answer applied throughout is: the validated content once, a reading of it once, and evidence that cannot be either.

## Why one document instead of one file per collection

The six plan CSVs are not six artifacts. They are one object with a join between its parts, written out along its seams. Reading the plan means opening six files and rebuilding the links between them; validating it means the six agreeing with each other, which nothing checks after they are written. The bundle that `validatePlanBundle` accepts is already the unit of truth, and `review-plan` already persists exactly that unit as a single document.

Splitting also loses information the object holds. A `test_case` row and its `test_steps` rows are related by an ID that survives the CSV only as a string; the canonical document carries the relation itself.

The cost is real and is accepted: a CSV opens in a spreadsheet and a JSON document does not. That reader is served by the summary document for reading and by an export command for tooling, rather than by seven skills each persisting a spreadsheet-shaped copy of their own state.

## Why metrics live only in the envelope

`finalize` writes `metrics` into the return envelope from the value its caller supplies, and four skills separately write the output of the same metric function to a `metrics.json`. There is no code path that compares them. Two numbers for one quantity is worse than one, because a reader who finds them disagreeing has no rule for which one governs, and `completed` depends on neither.

The envelope wins because it is a control file: it is schema-validated, it is written last, and it is where a caller already looks for the result of a run.

## Why the approved candidate set is derived rather than stored

`approved-playwright-candidates.json` is `approvedPlaywrightCandidates(rows)` frozen at write time. Keeping both means the matrix can be corrected while the derived file keeps the old answer, and the downstream skill reads whichever it happens to open.

Deriving it on read makes the matrix the only thing that can be wrong.

Residual risk, declared rather than closed: a reader that does not call the shared derivation can still compute the approved set differently. This change does not close that, because no code reads another run yet — `implement-playwright` still receives its candidates in its own input document. The gate that makes derivation the only path belongs to the change that introduces run lineage and the stage command, and until it lands the reduction here is in duplication, not in enforcement.

## Why raw tool output stays raw

Axe results and Lighthouse reports are the two obvious candidates for a durable `evidence/` folder. They stay out of it. The foundation already isolates raw or potentially sensitive output under the ignored raw evidence directory and promotes only redacted copies, and the extracted values these audits actually reason about — violations with their nodes, per-run metric values — are already fields of the validated audit document.

Promoting the full reports would move bulk unredacted tool output into the durable, checksummed, permanently kept directory to hold values the run already holds. The durable evidence slot is left for content that is genuinely irreducible: the per-defect reproduction folders, and later the Playwright report that verification is derived from.

## Why the improved plan takes the plan's own name

`plan/plan.json` and `review-plan/plan.json` hold the same shape under the same name because a consumer should not have to know whether a review happened in order to read a plan. The run directory the document sits in already records which stage produced it, and the envelope records the skill. Naming the reviewed output differently pushes that same fact into the filename and forces every downstream reader to handle two cases that behave identically.
