# Holistic QA

Holistic QA is a provider-neutral QA runtime and a set of independently callable Codex skills. The runtime makes QA outputs traceable, checksummed, permission-gated, and explicit about incomplete coverage.

The current construction provides the foundation contract, Codex adapter pipeline, and independently callable plan, review-plan, automation-strategy, implement-playwright, explore, accessibility, and performance skills. Remaining skills are added incrementally in this order: report and cycle. Claude Code packaging is planned for phase 2 and is not supported by the v1 adapter.

## Requirements

- Node.js 22 or later
- npm configured for `https://registry.npmjs.org/`
- OpenSpec 1.10.0 for specification workflow validation

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

Build the Codex installation layout with `npm run build:codex`. The generated skill is under `dist/codex/.agents/skills/holistic-qa-plan/` and its manifest records the provider-neutral source checksum.

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

```sh
npm ci --ignore-scripts --registry=https://registry.npmjs.org/
npm run validate
```

`npm run validate` checks schemas, deterministic behavior, failure scenarios, the clean Codex adapter build, OpenSpec artifacts, registry isolation, credential patterns, and prohibited private-organization contamination. No external defect publication or state-changing execution occurs in the foundation runtime.

## Limitations

The foundation does not yet execute QA stages, publish packages, submit marketplace entries, provide a Claude Code distribution, test mobile or desktop applications, perform penetration testing, or run backend load tests.
