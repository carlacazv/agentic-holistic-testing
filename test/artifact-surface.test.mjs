import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PLAN_REQUIRED_ARTIFACTS } from "../src/stages/plan.mjs";
import { REVIEW_PLAN_REQUIRED_ARTIFACTS } from "../src/stages/review-plan.mjs";
import { AUTOMATION_REQUIRED_ARTIFACTS } from "../src/stages/automation-strategy.mjs";
import { PLAYWRIGHT_REQUIRED_ARTIFACTS } from "../src/stages/implement-playwright.mjs";
import { explorationRequiredArtifacts } from "../src/stages/explore.mjs";
import { accessibilityRequiredArtifacts } from "../src/stages/accessibility.mjs";
import { performanceRequiredArtifacts } from "../src/stages/performance.mjs";

test("seven stage contracts expose fourteen canonical artifacts before independent evidence", () => {
  const paths = [
    ...PLAN_REQUIRED_ARTIFACTS, ...REVIEW_PLAN_REQUIRED_ARTIFACTS,
    ...AUTOMATION_REQUIRED_ARTIFACTS, ...PLAYWRIGHT_REQUIRED_ARTIFACTS,
    ...explorationRequiredArtifacts({ defects: [] }),
    ...accessibilityRequiredArtifacts({ defects: [] }),
    ...performanceRequiredArtifacts({ defects: [] }),
  ];
  assert.equal(paths.length, 14);
  assert.equal(paths.filter((item) => item.endsWith(".json")).length, 7);
  assert.equal(paths.filter((item) => item.endsWith("summary.md")).length, 7);
  assert.equal(paths.some((item) => item.endsWith("metrics.json") || item.endsWith(".csv")), false);
});

test("skill instructions do not advertise removed duplicate artifacts", async () => {
  const skills = ["plan", "review-plan", "automation-strategy", "implement-playwright", "explore", "accessibility", "performance"];
  const bodies = await Promise.all(skills.map((skill) => readFile(`skills/holistic-qa/${skill}/instructions.md`, "utf8")));
  const removed = /requirements\.csv|improved-plan\.json|candidate-matrix\.csv|approved-playwright-candidates\.json|implementation-manifest\.json|session-notes\.csv|budgets-or-baseline\.json|metrics\.json/;
  for (const body of bodies) assert.doesNotMatch(body, removed);
});
