## Context

Every rule below already existed in a skill instruction body. The gap was between what the instructions require and what the validators check, so the decision here is only how far each check should reach.

## Why an invalid `before` bundle does not block the review

The obvious reading of "never review an untrusted copy" is that `reviewPlan` should refuse a `before` bundle that fails `validatePlanBundle`. It should not. A plan that fails the quality contract - unlinked requirements, missing dispositions, untraceable cases - is exactly the input this skill exists to improve, and its own fixture depends on that. Blocking on it would make the skill unusable for its stated purpose.

The distinction that matters is between a bundle that is *wrong* and a bundle that is *unreadable*. Structural validity - a bundle object whose declared collections are arrays of identified records - is a precondition for computing any metric at all, and its absence is what previously produced a `TypeError` mid-review. Quality validity is the subject of the review and stays reported in `before_validation_errors`.

Residual risk, declared rather than closed: a degraded `before` bundle still becomes the baseline, so a caller who hands the reviewer a weakened copy of a valid plan can still record an apparent improvement. Closing that requires comparing the bundle against the upstream artifact checksum, which needs an expected checksum as an input to `reviewPlan`. No caller supplies one today, so the check would be opt-in and would close nothing. It is left for a follow-up that changes the input contract.

## Why removal is traced per record rather than per count

A review may legitimately shrink a plan by merging duplicate cases, which is one of its declared review dimensions. A rule that forbade any decrease in `test_cases_total` would block that legitimate outcome, and a rule that required one removal modification per review would license deleting the rest of the plan behind a single record. Requiring a `remove` or `merge` modification that names each departing record ID matches the granularity the skill already demands of every other change, and makes a smaller plan a recorded decision.

Steps whose parent case was itself removed are exempt: they leave as a consequence of a decision already recorded against the case.

## Why focused tests carry no escape hatch

A skipped test is visibly absent from a report and the skill accepts it against a recorded exclusion finding. `test.only` is different in kind: the other tests are not reported as skipped so much as never considered, while the repetition count and pass total stay internally consistent. There is no state in which committed automation intends it, so it is rejected without a finding category.
