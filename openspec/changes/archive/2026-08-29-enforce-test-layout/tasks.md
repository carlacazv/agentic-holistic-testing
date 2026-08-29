## 1. Declared layout

- [x] 1.1 Reject a spec outside `tests/<feature>/<name>.spec.ts` and a page or component object outside `tests/pom/<name>.page.ts` or `tests/pom/<name>.component.ts`; verify a flat spec, a spec inside the object folder, a deeper spec, an object beside its spec, and an object without its kind suffix are each named.
- [x] 1.2 Restructure `test/fixtures/playwright/` into the required layout and point the fixture config at it; verify `npm run test:playwright:fixture` passes three repetitions with zero retries.

## 2. Objects without an escape hatch

- [x] 2.1 Remove `inline` from the accepted UI abstractions so every browser spec names a provided page or component object; verify a spec declaring inline is rejected naming the two accepted values.

## 3. Locator evidence

- [x] 3.1 Require `locator_evidence` of `live-snapshot` or `inferred` on every file whose source declares an accessible or structural locator, and expose the inferred files so a run can declare them as gaps; verify a missing value, an unknown value, and an inferred file that stays valid.
- [x] 3.2 State the snapshot-confirmation flow, its permission and environment conditions, and that a missing environment yields inferred locators rather than a blocked run; verify `npm run validate` passes.
