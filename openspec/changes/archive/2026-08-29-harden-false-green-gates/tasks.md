## 1. Performance budget and repeatability gates

- [x] 1.1 Validate each declared budget's `id`, `source`, `target`, `metric`, `statistic`, `direction`, `threshold`, and `unit` against closed value sets in `validatePerformanceAudit`, and make `evaluateBudgets` return `passed: false` for any direction outside `max`/`min`; verify a `direction: "maximum"` budget measuring 9000 ms against a 2500 ms threshold is reported as failed and invalid.
- [x] 1.2 Apply the three-run repeatability floor per declared page rather than to the audit total; verify a two-page scope with two runs on one page and one on the other names the under-measured page.

## 2. Review-plan input and removal gates

- [x] 2.1 Return a blocking structural error from `reviewPlan` when either bundle is not an object or declares a non-array collection, before any metric is computed; verify a `requirements: "not-an-array"` bundle returns `valid: false` with null metrics instead of throwing.
- [x] 2.2 Require a `remove` or `merge` modification naming each test case, and each step whose case survives, that is present in `before` and absent from `after`; verify a nine-case plan reduced to four is rejected without those modifications and accepted with them.

## 3. Implementation evidence gates

- [x] 3.1 Reject a manifest with no approved candidate, no spec file, or a `verification_results.tests` value that is not a positive integer covering every declared spec; verify an empty manifest with consistent zero counts is rejected.
- [x] 3.2 Match `test.describe.skip` and `test.describe.fixme` in the exclusion gate and reject `test.only` and `test.describe.only` outright; verify a suite-level skip passes only with a recorded exclusion finding and that a focused test never passes.

## 4. Documentation and validation

- [x] 4.1 State the budget field contract, the per-page repetition floor, the removal-traceability rule, the manifest evidence minimum, and the focused-test prohibition in the affected skill instruction bodies; verify `npm run validate:adapter` succeeds for both providers.
- [x] 4.2 Run `npm test` and `npm run validate`; verify every gate above is covered by a test that fails against the previous validators.
