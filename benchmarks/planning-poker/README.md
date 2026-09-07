# Planning Poker benchmark

This benchmark exercises the public
[`ljeronimodarocha/planer-poker`](https://github.com/ljeronimodarocha/planer-poker)
repository without committing changes to that subject. Its harness follows the
maintainability principles demonstrated by
[`idavidov13/agentic-playwright`](https://github.com/idavidov13/agentic-playwright).

## What it proves

- Two browser contexts represent independent host and participant sessions.
- The first vote remains private until the second participant votes.
- Both clients converge on the revealed round.
- The host can save consensus and download the room-specific CSV.
- Password lengths immediately below, exactly at, and immediately above the
  documented minimum behave correctly.

The result is execution evidence, not proof that the product has no defects.
Host transfer, reconnection, accessibility, and performance remain outside this
benchmark.

## Harness architecture

```text
config/                         Environment-only configuration
enums/planning-poker/           Routes and observed UI strings
fixtures/pom/                   Single import point and Page Object injection
fixtures/helper/                Multi-context lifecycle and data cleanup
pages/planning-poker/           Focused Home and Room Page Objects
test-data/factories/            Seeded Faker data validated with strict Zod schemas
test-data/static/               Typed boundary partitions
tests/planning-poker/e2e/       Critical multi-user journey
tests/planning-poker/functional Password boundary behavior
```

Specs import `test` and `expect` only from `fixtures/pom/test-options.ts`.
Page Objects are instantiated only by fixtures, expose semantic locators and
business actions, and contain no test assertions. Assertions remain visible in
Given/When/Then report steps.

## Stability controls

- Locator priority is role, label, placeholder, text, then title. There are no
  XPath selectors, positional selectors, CSS selectors, or hard waits.
- The duplicate `Criar sala` accessible name in the subject makes the submit
  button ambiguous. The harness submits the form with Enter from the labeled
  password field instead of hiding the ambiguity with `nth()` or a structural
  selector.
- Dynamic happy-path data comes from a seeded Faker factory; curated boundary
  values stay in a typed TypeScript module.
- Every created room is registered before mutation and deleted by a teardown
  fixture. Browser contexts close in `finally`, including on assertion failure.
- CI pins locale and timezone, runs strict TypeScript validation, executes every
  case three times with one worker and zero retries, and retains HTML, JSON,
  JUnit, trace, screenshot, and video evidence.

The subject exposes no room-deletion API. The benchmark therefore uses a
benchmark-specific Prisma teardown fixture against its isolated SQLite database;
the workflow also removes that database after execution.

## Run locally

Set `APP_URL`, `DATABASE_URL`, `HOST`, `PORT`, and `ALLOWED_ORIGINS`, then run:

```sh
npx tsc --project tsconfig.e2e.json
npx playwright test --repeat-each=3 --retries=0 --workers=1
```
