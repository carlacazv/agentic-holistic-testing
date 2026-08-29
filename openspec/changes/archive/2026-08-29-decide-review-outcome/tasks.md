## 1. Declared outcome

- [x] 1.1 Require `mode` as `apply` or `complement` in `reviewPlan` and in the review schema, rejecting an absent or unknown mode; verify a review without a mode fails naming the accepted values.
- [x] 1.2 In complement mode, reject any record or link present in the bundle before the review and absent or changed after it, and skip the removal-traceability check that only applies when rewriting; verify an addition passes while a removal, a rewrite, and an unlinked risk each fail.

## 2. One readable result

- [x] 2.1 Replace the five evidence artifacts with `review-plan/review.md` carrying the mode, both bundle checksums, findings, modifications, before/after coverage, and remaining gaps; verify a finalized run holds exactly the improved plan and the review document.
- [x] 2.2 State the present-then-decide flow, the two outcomes, and the reduced artifact list in the review-plan instructions and the README skill table; verify `npm run validate` passes.
