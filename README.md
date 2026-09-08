# Holistic QA

A provider-neutral QA runtime and a set of independently callable skills, packaged for Codex and Claude Code. It makes QA output traceable, checksummed, permission-gated, and explicit about what it did not cover.

Available now: `plan`, `review-plan`, `automation-strategy`, `implement-playwright`, `explore`, `accessibility`, `performance`, `report`, and the optional `cycle` coordinator.

## Install

Run this from the root of the project you want to test. No clone, no copy step. Needs Node.js 22 or later.

```sh
npx github:carlacazv/agentic-holistic-testing install codex    # -> .agents/skills/holistic-qa-<id>/
npx github:carlacazv/agentic-holistic-testing install claude   # -> .claude/skills/holistic-qa-<id>/
```

Both providers list `holistic-qa-plan` and the remaining skills using portable hyphen-case names. Alongside the skills, each install writes a `holistic-qa-README.md` naming the pipeline order, independent audits, and optional orchestration. Add `--target <dir>` to install elsewhere. Both providers can share one project: separate directories, separate manifests.

Call any skill directly when you want a focused activity. Use `cycle` when you want to start from a quality goal and let the coordinator select the smallest useful set of skills. Explicitly choosing one skill never starts the full cycle.

For a guided end-to-end run:

```sh
holistic-qa doctor .
holistic-qa cycle-start "Assess checkout quality" --output qa/cycle.json
holistic-qa cycle-resume qa/cycle.json
holistic-qa cycle-complete qa/cycle.json plan <run-id>
holistic-qa cycle-summary qa/cycle.json
```

Cycle state is written atomically and can be resumed in another session. `cycle-complete` requires the run ID produced by the completed skill.

Re-run the command to update. There is no auto-update, and `npx` resolves the default branch when you run it, so you get `main` rather than a release; pin with `#<sha>` when a run must be reproducible.

## Skills

Run the pipeline in order - each step consumes the checksum-valid run the previous one produced, and each generated skill states its position and prerequisite so an agent can sequence them without this table.

| # | Skill | What it does |
| --- | --- | --- |
| 1 | `plan` | Risk-scored, technique-driven test plan. Every requirement and risk is test-linked or explicitly disposed as deferred, waived, externally covered, or not testable, with rationale. |
| 2 | `review-plan` | Reviews a checksum-valid plan run and reports the findings in the conversation. You choose to apply them, add them as a complement that only extends the plan, or neither - a review you do not act on writes nothing. A resolved finding with no linked modification, or any metric regression, is rejected. |
| 3 | `automation-strategy` | Recommends the lowest effective level per case (unit, component, API, browser E2E, manual) and emits an approval-gated Playwright candidate list. Never generates code. |
| 4 | `implement-playwright` | Turns approved candidates into a versioned, layered Playwright suite: central fixture injection, POM/COM separation, typed factories and static data, per-test tags and case annotations, explicit cleanup, pinned config, and lint/type-check/execution gates. Its AST validator rejects architectural drift before evidence can be finalized; the Planning Poker suite is the golden regression benchmark. |

Independent audits need an authorized target environment rather than a plan, and run in any order:

| Skill | What it does |
| --- | --- |
| `explore` | Session-based exploratory testing under an authorized charter and timebox, with indexed redacted evidence and one local reproduction folder per defect. |
| `accessibility` | WCAG 2.2 AA scope combining axe with manual checks. Automated passes alone stay partial evidence, and the output is not a certification. |
| `performance` | Compares declared budgets, or establishes a repeatable Lighthouse and API baseline that reports uncertainty instead of inventing an SLA. |

Optional workflow skills:

| Skill | What it does |
| --- | --- |
| `cycle` | Starts from a user goal, selects and sequences relevant work, and preserves explicit single-skill scope. |
| `report` | Combines valid run envelopes into an evidence-linked recommendation: ready, conditional, not-ready, or insufficient-evidence. |

Workflow completion, verification outcome, and release recommendation are separate. A QA run may complete successfully and correctly report a failed product verification.

## Run output

```text
qa/runs/<run-id>/          durable, checksummed artifacts
├── artifact-index.json
├── return-envelope.json
└── <skill>/
    ├── <canonical-document>.json
    ├── summary.md
    └── <independent evidence only>

test-results/<run-id>/     raw evidence, git-ignored
```

Every skill returns the same envelope. `completed` requires the declared scope covered and every required artifact valid; it is rejected when an artifact is missing, partial, tampered with, or paired with an unreported gap. `partial` means valid artifacts cover only part of the scope, `blocked` means a recoverable prerequisite is missing, and `failed` means an unrecoverable error.

Each stage has one canonical machine-readable document and one readable summary. Metrics live only in the return envelope, filtered views are derived on read, and separate evidence files exist only when the evidence cannot be represented by the canonical document. This prevents conflicting copies of the same result.

A completed run requires a non-empty artifact contract and cannot be silently recreated with the same run ID. Use a new run ID for a fork; explicit resume support is represented by the cycle state and will be expanded for stage-level writers.

Playwright verification is imported from its JSON reporter rather than authored as a claim:

```sh
holistic-qa validate playwright-implementation implementation.json
holistic-qa import-playwright implementation.json playwright-report.json "npm run test:e2e"
holistic-qa validate playwright-implementation implementation-with-evidence.json
```

### Preventing Playwright architecture drift

The implementation standard is enforced at several boundaries: the installable skill guides generation, the JSON Schema defines the manifest, the AST validator checks executable TypeScript, unit regressions reject known bad architectures, and the corrected Planning Poker suite is loaded as a golden fixture. Relevant contract changes also run that suite against the external Planning Poker repository three times with zero retries.

To make those controls mandatory on `main`, configure a GitHub branch ruleset that requires pull requests and these status checks:

- `Quality contract / validate`
- `Planning Poker benchmark / required`

The stable `required` benchmark job reports on every pull request; it only waits for the expensive external E2E job when contract-related paths changed. Disable direct pushes and bypasses for the actors that must follow the policy. Repository workflows detect violations, while the branch ruleset is what prevents a failing or missing check from being bypassed at merge time.

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
await run.writeArtifact("plan/plan.json", "{}\n", {
  type: "plan.document",
  mediaType: "application/json",
});
await run.writeArtifact("plan/summary.md", "# Plan\n", {
  type: "plan.summary",
  mediaType: "text/markdown",
});
await run.finalize({ skill: "plan", status: "completed", requiredArtifacts: ["plan/plan.json", "plan/summary.md"] });
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
