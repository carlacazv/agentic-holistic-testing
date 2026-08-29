import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { RunStore } from "../src/core/run-store.mjs";
import {
  PLAN_REQUIRED_ARTIFACTS,
  planMetrics,
  priorityForExposure,
  validatePlanBundle,
  writePlanBundle,
} from "../src/stages/plan.mjs";

async function fixture() {
  return JSON.parse(await readFile("test/fixtures/plan-bundle.valid.json", "utf8"));
}

test("risk priority thresholds include every boundary", () => {
  assert.deepEqual(
    [1, 5, 6, 11, 12, 19, 20, 25].map(priorityForExposure),
    ["P3", "P3", "P2", "P2", "P1", "P1", "P0", "P0"],
  );
  assert.throws(() => priorityForExposure(0), /1 through 25/);
});

test("valid fixture has complete traceability and metrics", async () => {
  const bundle = await fixture();
  assert.deepEqual(validatePlanBundle(bundle), { valid: true, errors: [] });
  assert.equal(planMetrics(bundle).requirements_accounted_percent, 100);
  assert.equal(planMetrics(bundle).risks_accounted_percent, 100);
  assert.deepEqual(
    new Set(bundle.test_cases.map((entry) => entry.technique)),
    new Set([
      "equivalence-partitioning",
      "boundary-value-analysis",
      "decision-table",
      "state-transition",
      "scenario-testing",
      "pairwise-selection",
      "error-guessing",
    ]),
  );
});

test("seeded omissions identify exact records", async () => {
  const bundle = await fixture();
  bundle.requirement_test_links = bundle.requirement_test_links.filter((link) => link.requirement_id !== "req-status");
  bundle.test_cases = bundle.test_cases.filter((entry) => entry.id !== "case-age-above");
  bundle.test_steps = bundle.test_steps.filter((entry) => entry.test_case_id !== "case-age-above");
  bundle.requirement_test_links = bundle.requirement_test_links.filter((entry) => entry.test_case_id !== "case-age-above");
  const errors = validatePlanBundle(bundle).errors.join("\n");
  assert.match(errors, /req-status/);
  assert.match(errors, /minimum-age is missing above/);
});

test("plan bundle renders checksum-valid artifacts and envelope", async (t) => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-plan-"));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const store = new RunStore({ workspace, runId: "run-plan-fixture-01" });
  await store.initialize();
  const entries = await writePlanBundle(store, await fixture());
  assert.equal(entries.length, PLAN_REQUIRED_ARTIFACTS.length);
  const result = await store.finalize({
    skill: "plan",
    status: "completed",
    requiredArtifacts: PLAN_REQUIRED_ARTIFACTS,
    metrics: planMetrics(await fixture()),
  });
  assert.equal(result.envelope.artifacts.length, PLAN_REQUIRED_ARTIFACTS.length);
});
