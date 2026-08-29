## 1. Convention Enforcement

- [x] 1.1 Enforce Given/When describe titles and Should step titles, rejecting a spec with no step; verify both rejections and their messages by unit test.
- [x] 1.2 Reject network-idle waits, element handles, sampled state assertions, positional locators without a `locator` finding, and skipped tests without an `exclusion` finding; verify each rejection and that a recorded finding restores acceptance.
- [x] 1.3 Add manifest `kind` handling with page and component objects that carry no assertions and declare no tests, and resolve accessible locators across a spec plus its declared objects; verify a page-object implementation validates and an object carrying an assertion fails.
- [x] 1.4 Require `ui_abstraction` on browser specs, a rationale for `inline`, an object file for a declared abstraction, and reject `inline` above one approved browser candidate; verify each case by unit test.

## 2. Instructions and Fixtures

- [x] 2.1 Document the structure, AAA mapping, DRY bar, flake rules, and the page/component object decision driven by approved strategy rows in the skill instructions; verify both provider adapters rebuild with the updated source checksum.
- [x] 2.2 Rewrite the Playwright fixtures into the convention with a real page object; verify the fixture suite passes three zero-retry repetitions and `npm run validate` passes twice.

## 3. Specification

- [x] 3.1 Sync the delta into `openspec/specs/implement-playwright-skill/spec.md` and archive the change; verify strict OpenSpec validation of active and archived artifacts.
