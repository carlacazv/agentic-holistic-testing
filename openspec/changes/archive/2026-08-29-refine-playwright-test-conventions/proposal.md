## Why

The implement-playwright capability declares only that tests must be maintainable and free of blind sleeps. It says nothing about how generated tests are structured, which flake-prone patterns are rejected, or when a page or component object is warranted, so two valid implementations of the same approved candidate can look unrelated and a reviewer has no stated bar to hold them to.

## What Changes

- Require a stated behavior structure: `Given`/`When` describe blocks, `Should` steps around assertions, and Arrange-Act-Assert mapped onto that structure.
- Require extracted helpers to stay free of assertions, caller branching, and cross-test state, so reuse never hides which expectation failed.
- Reject a named set of flake-prone patterns and route the legitimate exceptions through findings instead of through looser code.
- Require every browser spec to declare its UI abstraction as a page object, a component object, or inline, chosen from the approved strategy rows and justified when inline.
- Allow accessible locators to be defined in a declared page or component object rather than only in the spec, while assertions stay in the spec.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `implement-playwright-skill`: adds a behavior structure and DRY bar to maintainable tests, adds deterministic-execution rules with finding-based exceptions, adds a declared UI abstraction requirement, and widens accessible-locator resolution to a spec plus its declared objects.

## Impact

Affects `skills/holistic-qa/implement-playwright/instructions.md`, `src/stages/implement-playwright.mjs`, `test/implement-playwright.test.mjs`, and the Playwright fixtures under `test/fixtures/playwright/`. The implementation manifest gains a `kind` field per file and `ui_abstraction` / `ui_abstraction_rationale` on browser specs. No other capability, schema identifier, or foundation control changes.
