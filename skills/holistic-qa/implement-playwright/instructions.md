# Holistic QA Implement Playwright

Implement only checksum-valid automation-strategy rows that are `automate`, explicitly approved, and recommended at API or browser E2E. Validate target-environment permissions before state-changing execution. Never generate code for unapproved rows. Application-source changes require separate explicit approval.

The runtime contract is authoritative. Build the complete manifest, run `validatePlaywrightImplementation`, execute the declared quality commands, import the Playwright JSON report, and validate again before claiming completion. Do not weaken a rule to make generated code pass.

## Architecture preflight

Inspect the target repository before writing a spec: package manager, Playwright version, existing config, TypeScript settings, lint/type-check commands, test directories, fixtures, page/component objects, data builders, environment handling, and CI. Reuse an equivalent native convention when it already provides the same separation and controls; otherwise use the default layout below.

Declare one architecture profile in the manifest:

- `agentic-playwright` is the default. It uses the canonical layered paths and a central fixture assembled with `mergeTests`.
- `repository-native` preserves an established, structurally equivalent repository layout. It requires a concrete `rationale`; convenience or fewer files is not equivalence.

Also declare `standard_version: 1`, a single `fixture_import`, and one `test_structure`: `given-when-then`, `given-when-should`, or `repository-native`. Prefer `given-when-then` for new suites. This presentation choice is configurable; isolation, traceability, dependency injection, typed data, locator quality, and verification are not.

## Canonical layout

Under `agentic-playwright`, place files at:

| Concern | Path |
| --- | --- |
| API spec | `tests/<area>/api/<name>.spec.ts` |
| Browser journey | `tests/<area>/e2e/<name>.spec.ts` |
| Focused browser behavior | `tests/<area>/functional/<name>.spec.ts` |
| Page object | `pages/<area>/<name>.page.ts` |
| Shared component object | `pages/components/<name>.component.ts` or `pages/<area>/components/<name>.component.ts` |
| API/helper/POM fixture | `fixtures/<api|helper|pom>/<name>.ts` |
| Generated mutable data | `test-data/factories/<area>/<name>.factory.ts` |
| Immutable case table | `test-data/static/<area>/<name>.ts` |
| Routes, labels, domain values | `enums/<area>/<name>.ts` |
| Environment configuration | `config/<name>.ts` |
| Playwright configuration | `playwright.config.ts` |

Every manifest file declares its `kind`: `spec`, `page-object`, `component-object`, `fixture`, `factory`, `static-data`, `enum`, or `config`.

## Fixture composition and dependency injection

Create small fixture layers by responsibility and merge them through the declared central fixture, normally `fixtures/pom/test-options.ts`. Every spec imports both `test` and `expect` from that file. A direct spec import from `@playwright/test` is invalid.

Instantiate page and component objects in fixtures and inject them into tests. Specs must not call `new SomePage(page)`. Multi-user browser contexts, authenticated sessions, clocks, network doubles, and lifecycle cleanup belong in fixtures so creation and disposal cannot drift apart. Specs must not call `browser.newContext()`.

Page and component objects expose typed locators and user actions. They contain no assertions and no tests. Prefer composition over inheritance, and split objects that branch according to the calling test.

## Traceable test contract

Every `test()` has exactly one supported tag: `@smoke`, `@sanity`, `@regression`, `@e2e`, `@api`, or `@destructive`. Put tags on tests, never on `test.describe`. Every test also has a `test_case` annotation whose description is the planned case ID.

```ts
import { expect, test } from "../../../fixtures/pom/test-options";
import { createCartScenario } from "../../../test-data/factories/cart/cart.factory";

test.describe("Given an authenticated shopper with an empty cart", () => {
  test.afterEach(async ({ cartCleanup }) => cartCleanup.run());

  test(
    "adds an in-stock item",
    {
      tag: "@e2e",
      annotation: { type: "test_case", description: "case-042" },
    },
    async ({ cartPage, cartCleanup }, testInfo) => {
      const scenario = createCartScenario(testInfo.repeatEachIndex);
      cartCleanup.track(scenario.cartId);

      await test.step("WHEN the shopper adds the item", async () => {
        await cartPage.addItem(scenario.itemName);
      });

      await test.step("THEN the cart shows the item and updated count", async () => {
        await expect(cartPage.item(scenario.itemName)).toBeVisible();
        await expect(cartPage.count).toHaveText("1");
      });
    },
  );
});
```

For `given-when-then`, step titles begin with Given, When, or Then. For `given-when-should`, describe titles begin with Given or When and each assertion step begins with Should. In every profile, assertions belong inside `test.step`, and titles describe observable product behavior rather than DOM mechanics.

Keep Arrange, Act, and Assert distinguishable. Setup belongs to fixtures or the Given scope; perform the action once; keep expectations in outcome steps. Do not hide the action and its assertions together inside a helper.

## Data, state, and cleanup

Generated mutable data comes from a typed deterministic factory with explicit overrides and a run-scoped unique key. Immutable boundary tables come from typed TypeScript static-data modules, never imported JSON. Reusable routes, stable UI text, and domain values live in enums. Do not use `any`.

Every spec declares `expected_tests`, `mutates_state`, and `cleanup_strategy`. A mutating spec must import a declared factory and use one enforceable strategy: `after-each`, `after-all`, or a named lifecycle `fixture`. Prefer API or persistence cleanup over UI cleanup and execute it even after a failed assertion. A read-only spec declares `not-required`.

No test depends on execution order, shared residue, a shared mutable account, or the machine clock. If serialization is genuinely required, record why. Configuration owns absolute URLs and environment lookup; specs and support modules use relative routes or injected configuration.

## Locators and assertions

Browser locators live only in page or component objects. Prefer `getByRole`, `getByLabel`, and other accessible user-facing locators, with retrying web-first assertions in specs. A test ID, CSS/XPath selector, or positional locator requires a `locator` finding tied to the exact file and a reason accessible behavior is insufficient. Record locator evidence as `live-snapshot` or `inferred`; inferred evidence remains a completion gap.

API candidates use Playwright request context directly and validate observable status, body, and contract. Do not open a browser when API coverage provides equivalent confidence.

## Flake prevention

Flakiness is a defect. Reject these patterns:

- Fixed waits (`waitForTimeout`, `setTimeout`, sleep) instead of a concrete response, locator, or web-first assertion.
- `waitForLoadState("networkidle")` instead of the exact readiness signal.
- Cached element handles instead of locators.
- Sampled booleans such as `expect(await locator.isVisible()).toBe(true)` instead of retrying assertions.
- Conditional assertions or `try/catch` that permits an expected outcome to disappear.
- `.first()`, `.last()`, or `.nth()` used only to silence strict-mode ambiguity.
- Blanket timeout increases, manual polling loops, shared mutable state, and timing-dependent assertions.
- `test.only` or `test.describe.only` under any circumstance.
- Skip, fixme, or suite exclusion without an `exclusion` finding containing the reason and unblocker.

Retries stay at zero. Do not quarantine a failure to manufacture a green run.

## Configuration, CI, and evidence

Pin the exact Playwright semantic version. Pin locale and timezone. Configure HTML, JSON, and JUnit reporters plus trace, screenshot, and video retention for failures. Declare and execute separate lint, TypeScript, and Playwright commands; the declared Playwright command and imported command must match exactly.

Run the approved suite at least three times with zero retries and a Playwright JSON reporter. Import the report with:

```sh
holistic-qa import-playwright implementation.json playwright-report.json "<declared-playwright-command>"
```

Never author `verification_results` by hand. The importer binds the raw report checksum, executed command, and checksum of architecture, candidates, configuration, CI, paths, kinds, and sources. Preserve failed product assertions as valid evidence. Flaky, skipped, missing, under-counted, or stale evidence prevents a conclusive result.

## Return

Return the complete implementation in `implement-playwright/implementation.json` and the readable `implement-playwright/summary.md`, plus foundation controls. Include every generated or changed TypeScript file in the manifest, not only specs. Browser specs declare `ui_abstraction` and every referenced `ui_abstraction_path`.

Before writing artifacts, the validator must accept the manifest. The validator parses TypeScript structurally; comments and string lookalikes do not satisfy code rules. A deviation that is genuinely necessary is represented by the narrow supported finding, never by silently bypassing validation.

Return `blocked` for missing approval, environment, browser, credentials, or test data when no useful implementation can proceed. Return `partial` when a valid subset is implemented and all exclusions are explicit. Keep workflow status separate from verification status: completed implementation work may correctly report failed product assertions.
