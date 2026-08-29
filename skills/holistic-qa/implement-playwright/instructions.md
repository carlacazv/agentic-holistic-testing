# Holistic QA Implement Playwright

Implement only checksum-valid automation-strategy rows that are `automate`, explicitly approved, and recommended at API or browser E2E. Validate target environment permissions before any state-changing execution. Do not generate code for unapproved rows.

Use TypeScript and the target repository's native Playwright patterns. Prefer Playwright request contexts for API candidates. For browser candidates, prefer `getByRole`, `getByLabel`, and other accessible user-facing locators with web-first assertions. A test ID or CSS/XPath selector requires a locator/testability finding explaining why accessible behavior is insufficient. Application-source changes require separate explicit approval.

Use isolated deterministic test data and reusable fixtures only when they reduce duplication. Preserve planned case IDs in test titles or annotations. Do not use fixed timeout waits, blind retries, broad exception handling, or acceptance of flaky results.

Configure HTML, JSON, and JUnit reports plus trace, screenshot, and video capture for failures. Add CI integration using the verified public npm registry. Execute the approved suite at least three times with zero retries. Any failed repetition or retry-dependent pass prevents `completed` status.

Return the approved TypeScript tests, fixtures, Playwright configuration, CI integration, locator/testability findings, and verification results in `implement-playwright/implementation-manifest.json`, `implement-playwright/testability-findings.csv`, and `implement-playwright/verification-results.json`, plus foundation control files. Return `blocked` for missing approval, environment, browser, credentials, or test data when no useful implementation can proceed; return `partial` when a valid subset is implemented and every excluded candidate is explicit.
