## Why

Using the skill produced a single file holding everything, and that was a valid output rather than a deviation. The validator checked only extensions - `.spec.ts` for a spec, anything else for an object - so nothing said where a file belongs, and `inline` let one approved browser candidate keep its locators in the spec with a written rationale. Two rules that each looked reasonable combined into an implementation with no structure, and a reader had no directory to open to find a feature's coverage.

The locators themselves carry the same silence. They are inferred from application source and first tested when the suite runs, so an invented locator or a selector matching two elements survives until execution. The pinned Playwright MCP already resolves as a browser capability for running the suite; nothing uses it while the locators are being chosen, which is when a live accessibility snapshot would settle the question.

## What Changes

- Place every generated file: specs at `tests/<feature>/<name>.spec.ts`, page and component objects at `tests/pom/<name>.page.ts` and `tests/pom/<name>.component.ts`.
- Remove the `inline` UI abstraction, so every spec covering a browser candidate names a page or component object that is provided.
- Record on every file that declares locators whether they were confirmed against a running target through an accessibility snapshot or inferred from source, and treat an inferred file as a declared gap rather than an equal claim.
- Restructure the repository's own Playwright fixtures into the layout the validator now requires.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `implement-playwright-skill`: adds the file layout and the locator evidence declaration, and removes the inline abstraction.

## Impact

Affects `src/stages/implement-playwright.mjs`, `test/implement-playwright.test.mjs`, `test/fixtures/playwright/**`, the implement-playwright instructions, and the README skill table. Existing manifests break twice: a path outside the layout is rejected, and `ui_abstraction: "inline"` is no longer an accepted value. Locator discovery is never a prerequisite - a run without an authorized environment produces inferred locators and stays completable, with the gap declared.
