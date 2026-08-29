# Holistic QA

A provider-neutral QA runtime and a set of independently callable skills, packaged for Codex and Claude Code. It makes QA output traceable, checksummed, permission-gated, and explicit about what it did not cover.

Available now: `plan`, `review-plan`, `automation-strategy`, `implement-playwright`, `explore`, `accessibility`, `performance`. Next: `report`, then `cycle`.

## Install

Run this from the root of the project you want to test. No clone, no copy step. Needs Node.js 22 or later.

```sh
npx github:carlacazv/agentic-holistic-testing install codex    # -> .agents/skills/holistic-qa-<id>/
npx github:carlacazv/agentic-holistic-testing install claude   # -> .claude/skills/holistic-qa-<id>/
```

Codex then lists `holistic-qa:plan` and the rest; Claude Code lists `holistic-qa-plan`. Add `--target <dir>` to install elsewhere. Both providers can share one project: separate directories, separate manifests.

Re-run the command to update. There is no auto-update, and `npx` resolves the default branch when you run it, so you get `main` rather than a release; pin with `#<sha>` when a run must be reproducible.

## Skills

| Skill | What it does |
| --- | --- |
| `plan` | Risk-scored, technique-driven test plan. Every requirement and risk is test-linked or explicitly disposed as deferred, waived, externally covered, or not testable, with rationale. |
| `review-plan` | Reviews a checksum-valid plan run and returns exact findings, modifications, and before/after metrics. A resolved finding with no linked modification, or any metric regression, is rejected. |
| `automation-strategy` | Recommends the lowest effective level per case (unit, component, API, browser E2E, manual) and emits an approval-gated Playwright candidate list. Never generates code. |
| `implement-playwright` | Turns approved candidates into TypeScript tests using Given/When describes, Should steps, and page or component objects. Requires three zero-retry repetitions with no flaky outcome. |
| `explore` | Session-based exploratory testing under an authorized charter and timebox, with indexed redacted evidence and one local reproduction folder per defect. |
| `accessibility` | WCAG 2.2 AA scope combining axe with manual checks. Automated passes alone stay partial evidence, and the output is not a certification. |
| `performance` | Compares declared budgets, or establishes a repeatable Lighthouse and API baseline that reports uncertainty instead of inventing an SLA. |

## Run output

```text
qa/runs/<run-id>/          durable, checksummed artifacts
├── artifact-index.json
├── return-envelope.json
└── <skill artifacts>

test-results/<run-id>/     raw evidence, git-ignored
```

Every skill returns the same envelope. `completed` requires the declared scope covered and every required artifact valid; it is rejected when an artifact is missing, partial, tampered with, or paired with an unreported gap. `partial` means valid artifacts cover only part of the scope, `blocked` means a recoverable prerequisite is missing, and `failed` means an unrecoverable error.

## Safety gates

- Targets are classified as local, development, test, staging, or production.
- Guided state changes require a recorded capability approval; autonomous runs can use only pre-authorized capabilities.
- Production is disabled by default and stays read-only after explicit authorization.
- Credentials are referenced by provider and key; values never enter the execution context.
- Promoting text to durable evidence redacts secrets and common authorization, cookie, token, key, and URL credential forms.
- Browser work resolves the pinned `@playwright/mcp` in `integrations/playwright-mcp.json`, then a provider browser tool, then the Playwright CLI. Missing browser coverage is reported, never silently dropped.

## Using the runtime directly

Add the repository as a git dependency to drive `RunStore` and the stage helpers yourself:

```json
"dependencies": { "@carlacazv/holistic-qa": "github:carlacazv/agentic-holistic-testing" }
```

```js
import { RunStore } from "@carlacazv/holistic-qa";

const run = new RunStore({ workspace: process.cwd(), runId: "run-example-0001" });
await run.initialize();
await run.writeArtifact("plan/requirements.md", "# Requirements\n", {
  type: "plan.requirements",
  mediaType: "text/markdown",
});
await run.finalize({ skill: "plan", status: "completed", requiredArtifacts: ["plan/requirements.md"] });
```

## Contributing

```sh
git clone https://github.com/carlacazv/agentic-holistic-testing.git
cd agentic-holistic-testing
mise trust . && mise install   # Node 22, pinned in mise.toml
mise run setup                 # npm ci, then build both provider layouts
mise run validate:all          # or: npm run validate
```

`mise tasks` lists every task with its description; each mirrors an npm script, and task scripts live at `.mise/tasks/<area>/<name>`. `validate:all` checks schemas, deterministic behavior, failure scenarios, both adapter builds against their provider-neutral source checksums, OpenSpec artifacts, registry isolation, and credential and contamination scans.

## Limitations

Does not publish packages, list either adapter in a provider marketplace, test mobile or desktop applications, perform penetration testing, or run backend load tests.
