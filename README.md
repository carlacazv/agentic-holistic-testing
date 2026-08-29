# Holistic QA

Holistic QA is a provider-neutral QA runtime and a set of independently callable skills packaged for both Codex and Claude Code. The runtime makes QA outputs traceable, checksummed, permission-gated, and explicit about incomplete coverage.

The current construction provides the foundation contract, Codex and Claude Code adapter pipelines, and independently callable plan, review-plan, automation-strategy, implement-playwright, explore, accessibility, and performance skills. Remaining skills are added incrementally in this order: report and cycle.

## Requirements

- Node.js 22 or later (pinned to exactly 22 in `mise.toml` if you use [mise](https://mise.jdx.dev/))
- npm configured for `https://registry.npmjs.org/`
- OpenSpec 1.10.0 for specification workflow validation

## Installation

Holistic QA is source-installed. `package.json` sets `"private": true`, so it is never published to a registry; both the packaged skills and the runtime library are consumed straight from a checkout.

1. Clone the repository and enter it:

   ```sh
   git clone https://github.com/carlacazv/agentic-holistic-testing.git
   cd agentic-holistic-testing
   ```

2. Install the pinned Node.js toolchain, then dependencies and both provider layouts, with one command:

   ```sh
   mise trust . && mise install   # installs Node 22 from mise.toml
   mise run setup                 # npm ci, then build both dist/codex and dist/claude
   ```

   Without mise, run the equivalent steps directly (Node 22+ must already be on `PATH`):

   ```sh
   npm ci --ignore-scripts --registry=https://registry.npmjs.org/
   npm run build:codex    # writes dist/codex/.agents/skills/holistic-qa-<id>/
   npm run build:claude   # writes dist/claude/.claude/skills/holistic-qa-<id>/
   ```

   Every generated `SKILL.md` embeds a checksum of its provider-neutral source under `skills/holistic-qa/<id>/instructions.md`; `mise run validate:adapter` (or `npm run validate:adapter`) rebuilds both providers into a temporary directory and fails if a generated body ever drifts from that source.

3. Copy the generated skill directories into the project where you want to invoke them - there is no publish step or auto-sync, so re-run `mise run build:all` (or the matching `build:*` command) and re-copy whenever this repository updates:

   - Codex: copy `dist/codex/.agents/skills/holistic-qa-*` into `<your-project>/.agents/skills/`.
   - Claude Code: copy `dist/claude/.claude/skills/holistic-qa-*` into `<your-project>/.claude/skills/`.

4. Confirm the skills are discovered: Codex should list `holistic-qa:plan` and the other declared skills through its own skill listing, and Claude Code should list `holistic-qa-plan` and the rest through its `Skill` tool or `/help`.

To use the runtime library directly (`RunStore` and the core/stage helpers, shown next) instead of only the packaged skills, add this repository as a git dependency in your own `package.json` rather than installing from a registry:

```json
"dependencies": {
  "@carlacazv/holistic-qa": "github:carlacazv/agentic-holistic-testing"
}
```

### Task runner (mise)

Every npm script has a matching [mise](https://mise.jdx.dev/) task under `.mise/tasks/`, organized by area; `mise.toml` pins Node 22 so every task runs on the right toolchain without touching your global Node install. Run `mise tasks` for the full list with descriptions, or use one directly:

```sh
mise run setup               # npm ci + build both provider layouts (first run)
mise run node:install        # npm ci
mise run node:clean          # remove node_modules/ and dist/
mise run build:codex         # build only the Codex layout
mise run build:claude        # build only the Claude Code layout
mise run build:all           # build both
mise run test:unit           # node --test
mise run test:playwright     # Playwright fixture suite
mise run test:performance    # Lighthouse/API performance fixture
mise run test:all            # every test layer above
mise run validate:schemas    # JSON Schemas + pinned browser integration
mise run validate:adapter    # rebuild + checksum-verify both adapters
mise run validate:openspec   # active + archived OpenSpec artifacts
mise run scan                # credential / private-registry contamination scan
mise run validate:all        # the full npm run validate pipeline
```

Task scripts are plain executable bash under `.mise/tasks/<area>/<name>` (path segments join with `:` into the task name, e.g. `.mise/tasks/build/codex` → `build:codex`); each delegates to the matching `npm run` script, so both interfaces always do the same thing.

## Foundation workflow

Create a run with `RunStore`, declare its environment and permissions, write raw evidence only under `test-results/<run-id>/`, promote redacted text into `qa/runs/<run-id>/`, register each generated artifact, and finalize with the shared return envelope.

```js
import { RunStore } from "@carlacazv/holistic-qa";

const run = new RunStore({ workspace: process.cwd(), runId: "run-example-0001" });
await run.initialize();
await run.writeArtifact("plan/requirements.md", "# Requirements\n", {
  type: "plan.requirements",
  mediaType: "text/markdown",
});
await run.finalize({
  skill: "plan",
  status: "completed",
  requiredArtifacts: ["plan/requirements.md"],
});
```

Durable run controls use this structure:

```text
qa/runs/<run-id>/
├── artifact-index.json
├── return-envelope.json
└── <skill-generated artifacts>

test-results/<run-id>/
└── <ignored raw evidence>
```

The status is `partial` when valid artifacts exist but declared coverage is incomplete, `blocked` when a recoverable prerequisite prevents useful work, and `failed` for an unrecoverable execution error. `completed` is rejected when a required artifact is missing, partial, tampered with, or accompanied by an unreported gap.

## Plan workflow

Invoke `holistic-qa:plan` with requirements or another authoritative behavior source, accepted scope, known risks, and target environment. The skill scores impact × likelihood, selects test-design techniques from the requirement shape, declares test-data prerequisites, and returns normalized requirements, risks, cases, steps, traceability links, rationale, and metrics under `qa/runs/<run-id>/plan/`.

Every accepted requirement and identified risk must be linked to tests or explicitly disposed as deferred, waived, externally covered, or not testable with rationale. Completion therefore means 100% accounted scope, not that every item was necessarily selected for execution.

Invoke `holistic-qa:review-plan` with a checksum-valid plan run. It preserves the original, validates the improved bundle, and returns exact findings and modifications with before/after metrics. A resolved finding without a linked modification or a metric regression is rejected.

Invoke `holistic-qa:automation-strategy` with the reviewed plan. It assesses every case, recommends the lowest effective unit/component/API/browser/manual level, and emits a separate approval-gated list for Playwright API and browser implementation. It never generates code.

Invoke `holistic-qa:implement-playwright` only after approving API/browser candidates. It generates TypeScript using request contexts or accessible browser locators, configures failure evidence and reports, and requires three zero-retry repetitions with no flaky outcome. Application-source changes remain separately approval-gated.

Invoke `holistic-qa:explore` with an authorized charter and timebox. It records session and coverage notes, indexes redacted evidence, and creates one local reproduction folder per confirmed or suspected defect. External defect publication always requires explicit approval.

Invoke `holistic-qa:accessibility` with declared WCAG 2.2 AA scope. It combines axe with manual keyboard, focus, reflow, name/role/value, status, contrast, spacing, and target checks. Automated passes alone remain partial evidence, and the output is not a certification.

Invoke `holistic-qa:performance` with explicit conditions and budgets. Without budgets it establishes a repeatable Lighthouse/API baseline and reports uncertainty rather than inventing an SLA. Backend load testing remains outside v1.

## Safety gates

- Targets are classified as local, development, test, staging, or production.
- Guided state changes require a recorded capability approval.
- Autonomous runs can use only pre-authorized capabilities.
- Production is disabled by default and remains read-only after explicit authorization.
- Credentials are referenced by provider and key; values are never part of the execution context.
- Text promotion redacts configured secrets and common authorization, cookie, token, key, and URL credential forms.
- Browser resolution uses the exact optional `@playwright/mcp` version in `integrations/playwright-mcp.json`, then a provider browser tool, then Playwright CLI. Missing browser coverage is reported rather than silently excluded.

## Validation

Contributors, after installing dependencies (Installation step 2), run:

```sh
mise run validate:all   # or: npm run validate
```

`npm run validate` checks schemas, deterministic behavior, failure scenarios, the clean Codex and Claude Code adapter builds, OpenSpec artifacts, registry isolation, credential patterns, and prohibited private-organization contamination. No external defect publication or state-changing execution occurs in the foundation runtime.

## Limitations

The foundation does not yet execute QA stages, publish packages, submit marketplace entries, list either adapter in a provider marketplace, test mobile or desktop applications, perform penetration testing, or run backend load tests.
