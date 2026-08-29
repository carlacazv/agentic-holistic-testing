import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { RunStore } from "../src/core/run-store.mjs";
import {
  AUTOMATION_REQUIRED_ARTIFACTS,
  approvedPlaywrightCandidates,
  recommendAutomationLevel,
  validateAutomationStrategy,
  writeAutomationStrategy,
} from "../src/stages/automation-strategy.mjs";

const caseIds = ["case-unit", "case-component", "case-api", "case-browser", "case-manual"];
const rows = [
  { test_case_id: "case-unit", unit_suitable: true, component_suitable: true, api_suitable: true, browser_suitable: true, manual_required: false, recommended_level: "unit", impact_value: 3, stability: 5, cost: 1, decision: "automate", approved: false, rationale: "Pure validation logic" },
  { test_case_id: "case-component", unit_suitable: false, component_suitable: true, api_suitable: true, browser_suitable: true, manual_required: false, recommended_level: "component", impact_value: 3, stability: 4, cost: 2, decision: "automate", approved: false, rationale: "Requires component integration" },
  { test_case_id: "case-api", unit_suitable: false, component_suitable: false, api_suitable: true, browser_suitable: true, manual_required: false, recommended_level: "api", impact_value: 5, stability: 5, cost: 2, decision: "automate", approved: true, rationale: "HTTP boundary gives equivalent confidence" },
  { test_case_id: "case-browser", unit_suitable: false, component_suitable: false, api_suitable: false, browser_suitable: true, manual_required: false, recommended_level: "browser-e2e", impact_value: 5, stability: 4, cost: 4, decision: "automate", approved: true, rationale: "Keyboard focus is browser-only" },
  { test_case_id: "case-manual", unit_suitable: false, component_suitable: false, api_suitable: false, browser_suitable: false, manual_required: true, recommended_level: "manual", impact_value: 2, stability: 2, cost: 3, decision: "manual", approved: false, rationale: "Requires human judgment" }
];

test("strategy recommends the lowest effective level", () => {
  assert.deepEqual(rows.map(recommendAutomationLevel), ["unit", "component", "api", "browser-e2e", "manual"]);
  assert.deepEqual(validateAutomationStrategy(caseIds, rows), { valid: true, errors: [] });
  assert.deepEqual(approvedPlaywrightCandidates(rows).map((row) => row.test_case_id), ["case-api", "case-browser"]);
});

test("strategy rejects missing cases and inflated browser recommendations", () => {
  const invalid = structuredClone(rows.slice(1));
  invalid[0].recommended_level = "browser-e2e";
  const errors = validateAutomationStrategy(caseIds, invalid).errors.join("\n");
  assert.match(errors, /missing planned case case-unit/);
  assert.match(errors, /expected component/);
});

test("strategy artifacts finalize", async (t) => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-strategy-"));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const store = new RunStore({ workspace, runId: "run-strategy-0001" });
  await store.initialize();
  assert.equal((await writeAutomationStrategy(store, caseIds, rows)).length, 3);
  const result = await store.finalize({ skill: "automation-strategy", status: "completed", requiredArtifacts: AUTOMATION_REQUIRED_ARTIFACTS });
  assert.equal(result.envelope.status, "completed");
});
