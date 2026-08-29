# Holistic QA Implement Playwright

Implement only checksum-valid automation-strategy rows that are `automate`, explicitly approved, and recommended at API or browser E2E. Validate target environment permissions before any state-changing execution. Do not generate code for unapproved rows. Application-source changes require separate explicit approval.

## Test structure

Express every test as Given / When / Should, so the suite reads as declared behavior and a failure names the exact expectation that broke.

- `test.describe("Given <precondition or context>")` states the world before the action. Nest a second `test.describe("Given ...")` only when a genuinely narrower precondition applies.
- `test.describe("When <single action under test>")` states the action. One `When` block covers one action; a second action means a second `When` block or a separate test.
- `test.step("Should <observable outcome>")` wraps each assertion group. Step titles are outcomes in the product's language, never mechanics: `Should show the confirmation banner`, not `Should check the div`.
- Preserve the planned case ID in the `test()` title or as an annotation so plan traceability survives into reports.

Map Arrange-Act-Assert onto that structure and keep the three phases separate and ordered:

- **Arrange** belongs to the `Given` scope: fixtures, `beforeEach`, and deterministic data setup. Never assert here except an explicit precondition guard.
- **Act** is the single action the `When` block names, executed once at the top of the test body.
- **Assert** happens only inside `Should` steps. Do not perform new actions after the first assertion; a further action means a new `When` block or a new test.

```ts
test.describe("Given an authenticated shopper with an empty cart", () => {
  test.beforeEach(async ({ request }) => {
    await resetCart(request); // Arrange
  });

  test.describe("When adding an in-stock item", () => {
    test("case-042 adds the item to the cart", async ({ page, cart }) => {
      await cart.addItem("Blue mug"); // Act

      await test.step("Should list the item in the cart", async () => {
        await expect(page.getByRole("listitem", { name: "Blue mug" })).toBeVisible();
      });

      await test.step("Should increment the cart count to 1", async () => {
        await expect(page.getByRole("status", { name: "Cart count" })).toHaveText("1");
      });
    });
  });
});
```

## Keep it DRY without hiding behavior

Extract a helper, fixture, or page object when a locator chain or flow is repeated across tests or specs. Build test data through deterministic factories with explicit overrides rather than duplicated literals. Put shared setup in a fixture or `beforeEach` owned by the `Given` block it belongs to.

Do not abstract past the point of readability. The Act and the assertions stay visible in the test body: a helper that performs the action under test and its assertions makes failures unattributable. Shared helpers must not contain assertions belonging to a single test, must not branch on which test called them, and must not carry state between tests.

## Choosing page or component objects

UI abstraction is a decision, not a default. Decide it per browser spec from the approved candidates and the surfaces they traverse, declare the choice as `ui_abstraction` on the file, and record why.

- **API candidates take no UI abstraction.** Request-context tests address the HTTP boundary directly; a page object there is indirection with no reuse.
- **`inline`** — keep locators in the spec when the approved candidates include exactly one browser row and the flow touches one surface. Abstracting a single flow buys nothing and costs a layer. This choice requires a written rationale.
- **Page object (POM)** — when more than one approved browser candidate traverses the same route or flow, or when the strategy scored that surface as low `stability`, so churn should hit one file instead of every spec. Model one object per route or per coherent flow.
- **Component object (COM)** — when the recurring surface is a widget reused across several routes or flows rather than a page: a design-system control, a shared table, a date picker, a modal. The signal is repetition across the approved browser specs: the same widget's locators are needed under more than one route or flow, so the abstraction follows the widget rather than whichever page it happens to sit on. Compose it into the page objects that use it. Strategy rows carry no component signal here — a case whose confidence is equivalent at component level is recommended and covered at that level, and never becomes a Playwright candidate.

Prefer composing component objects inside page objects over deep page-object inheritance. Objects expose locators and actions only: they must contain no assertions and declare no tests, so every expectation stays in a `Should` step where a failure names it. Objects that grow branching logic about what the caller wants are a signal to split them.

## Locators and assertions

Use TypeScript and the target repository's native Playwright patterns. Prefer Playwright request contexts for API candidates: validate observable status, body, and contract, isolate state, and do not open a browser when request-level coverage gives equivalent confidence.

For browser candidates prefer `getByRole`, `getByLabel`, and other accessible user-facing locators with web-first assertions. A test ID or CSS/XPath selector requires a locator/testability finding explaining why accessible behavior is insufficient.

## Flake prevention

Flakiness is a defect in the test, not a tolerated cost. Every generated test must be deterministic under repeated parallel execution.

Prohibited, with the required replacement:

- Fixed waits (`waitForTimeout`, `setTimeout`, `sleep`) → a web-first assertion that auto-retries, or a wait for the specific response or element that gates the next step.
- `waitForLoadState("networkidle")` → wait for the concrete element or the exact request the test depends on.
- Manual polling loops and `while` retries → `expect.poll` or `expect(...).toPass()` with an explicit timeout and a stated reason.
- Reading state then asserting (`const visible = await x.isVisible(); expect(visible).toBe(true)`) → `await expect(x).toBeVisible()`, so Playwright retries the assertion instead of sampling once.
- Conditional assertions (`if (await x.isVisible()) { ... }`) and `try/catch` around assertions → assert the expected outcome unconditionally; a genuinely optional outcome is a missing precondition, so fix the Arrange.
- `.first()`, `.last()`, or `.nth()` used to escape a strict-mode ambiguity → narrow the locator so it resolves to exactly one element; positional access is acceptable only when position is the behavior under test.
- Cached `elementHandle` references → locators, which re-query on use and survive re-renders.
- Blanket `test.setTimeout` or raised global timeouts to make a test pass → find the real wait condition.

Required for isolation and determinism:

- Each test creates the data it needs with a run-scoped unique key and cleans up through the API, never through the UI, and never depends on another test's residue or on execution order.
- No shared mutable state, account, or record between tests that run in parallel. If serialization is genuinely required, declare it explicitly and record why.
- Pin timezone and locale in the configuration. Inject or freeze dates rather than asserting against the machine clock.
- Stub or await the exact network calls the assertion depends on; never rely on request ordering or on incidental timing.
- Do not assert on animation-dependent intermediate states; assert the settled outcome.
- Never mark a test skipped, quarantined, or retried to get a green run. Any exclusion requires a recorded finding with rationale and an unblocker, at test or suite level (`test.skip`, `test.fixme`, `test.describe.skip`).
- `test.only` and `test.describe.only` are rejected outright: a focused run drops every other test while the repetition evidence still reads green.

## Configuration and verification

Configure HTML, JSON, and JUnit reports plus trace, screenshot, and video capture for failures. `test.step` boundaries must remain visible in the report and trace so a failure is attributable to its `Should`. Add CI integration using the verified public npm registry.

Execute the approved suite at least three times with zero retries. Any failed repetition, retry-dependent pass, or inconsistent result across repetitions prevents `completed` status and is reported as evidence, never reclassified.

## Return

Return the approved TypeScript tests, fixtures, Playwright configuration, CI integration, locator/testability findings, and verification results in `implement-playwright/implementation-manifest.json`, `implement-playwright/testability-findings.csv`, and `implement-playwright/verification-results.json`, plus foundation control files.

Each manifest file entry declares its `kind` (`spec`, `page-object`, or `component-object`; `spec` when omitted). Every spec covering a browser candidate also declares `ui_abstraction` and, when that value is `inline`, a `ui_abstraction_rationale`. The manifest declares at least one approved candidate, at least one spec, and a `verification_results.tests` count that is a positive integer covering every declared spec, so an empty or under-executed run cannot reach `completed`. `validatePlaywrightImplementation` enforces the structure, flake, and abstraction rules above and rejects the implementation before any artifact is written, so a deviation that is genuinely correct must be justified through a finding rather than by loosening the code: category `locator` covers a structural or positional selector, and category `exclusion` covers a skipped test.

Return `blocked` for missing approval, environment, browser, credentials, or test data when no useful implementation can proceed. Return `partial` when a valid subset is implemented and every excluded candidate is explicit.
