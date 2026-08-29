## Why

Three validators accept deliverables that carry no evidence, and each one returns `valid: true` while doing it. An implementation manifest with zero candidates and zero files passes `validatePlaywrightImplementation`, so `completed` is claimable with no tests. A budget whose `direction` is misspelled is treated as a minimum, so a measured LCP of 9000 ms passes a 2500 ms threshold. A plan review that drops five of nine test cases passes the regression gate, because the gate reads only the four percentage metrics and every surviving case stays linked. `test.describe.skip` and `test.only` reach the exclusion check unmatched, and a malformed upstream bundle crashes the reviewer with a `TypeError` instead of blocking.

A gate that reports green on absent evidence is worse than no gate: the run carries the validator's authority into a decision it never checked.

## What Changes

- Validate every declared budget field before comparing a threshold, and treat an unrecognized direction as a failed comparison rather than an assumed minimum.
- Require at least three comparable Lighthouse runs for each declared page, not three runs across the whole audit.
- Reject an implementation manifest with no approved candidate, no spec file, or a `verification_results.tests` count that is not a positive integer covering every declared spec.
- Match suite-level exclusions (`test.describe.skip`, `test.describe.fixme`) in the exclusion gate, and reject focused tests (`test.only`, `test.describe.only`) outright.
- Stop a plan review on a structurally unusable bundle before any metric is computed, instead of throwing.
- Require a `remove` or `merge` modification naming each test case or step that leaves the plan during a review.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `performance-skill`: budget declarations are validated before comparison, and the repeatability floor applies per page.
- `review-plan-skill`: unusable upstream input blocks, and coverage removal is traceable to an exact modification.
- `implement-playwright-skill`: an empty or under-executed implementation cannot be accepted, and suite-level exclusions and focused tests are rejected.

## Impact

Affects `src/stages/performance.mjs`, `src/stages/review-plan.mjs`, `src/stages/implement-playwright.mjs`, their tests, and the three skill instruction bodies that describe the rules. Existing valid runs are unaffected; the change only moves inputs that were silently accepted into declared errors.
