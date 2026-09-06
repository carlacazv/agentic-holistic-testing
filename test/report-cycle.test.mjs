import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { RunStore } from "../src/core/run-store.mjs";
import { buildQualityReport, recommendRelease, REPORT_REQUIRED_ARTIFACTS, writeQualityReport } from "../src/stages/report.mjs";
import { completeCycleStep, createCycleState, nextCycleStep, validateCycleState } from "../src/workflows/cycle.mjs";

function run(overrides = {}) {
  return {
    run_id: "run-source-0001", skill: "implement-playwright", status: "completed",
    verification_status: "pass", artifacts: [], gaps: [], residual_risks: [], ...overrides,
  };
}

test("release recommendation separates completed work from failed verification", () => {
  assert.equal(recommendRelease({ runs: [run()] }), "ready");
  assert.equal(recommendRelease({ runs: [run({ verification_status: "fail" })] }), "not-ready");
  assert.equal(recommendRelease({ runs: [run({ status: "partial", gaps: ["Safari not run"] })] }), "insufficient-evidence");
  assert.equal(recommendRelease({ runs: [run({ residual_risks: ["Low risk"] })] }), "conditional");
  assert.equal(recommendRelease({ runs: [run({ skill: "plan", verification_status: "not-run" })] }), "insufficient-evidence");
  assert.equal(recommendRelease({ runs: [run({ verification_status: "not-run" })] }), "insufficient-evidence");
  assert.equal(recommendRelease({ runs: [run({ skill: "plan", verification_status: "not-run" }), run()] }), "ready");
});

test("quality report preserves evidence, gaps, and decision ownership", async (t) => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-report-"));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const source = run({ artifacts: [{ path: "evidence/result.json", checksum: `sha256:${"1".repeat(64)}` }] });
  const report = buildQualityReport({ goal: "Assess checkout", runs: [source], decisionOwner: "Product owner" });
  assert.equal(report.recommendation, "ready");
  assert.equal(report.evidence[0].run_id, source.run_id);
  const store = new RunStore({ workspace, runId: "run-report-0001" });
  await store.initialize();
  await writeQualityReport(store, { goal: "Assess checkout", runs: [source], decisionOwner: "Product owner" });
  const finalized = await store.finalize({
    skill: "report", status: "completed", requiredArtifacts: REPORT_REQUIRED_ARTIFACTS,
    verificationStatus: "pass", releaseRecommendation: report.recommendation,
  });
  assert.equal(finalized.envelope.release_recommendation, "ready");
  assert.match(await readFile(path.join(store.durableDirectory, "report/summary.md"), "utf8"), /Product owner/);
});

test("cycle is optional and explicit skill invocation stays isolated", () => {
  const explicit = createCycleState({ goal: "Audit accessibility", explicitSkill: "accessibility" });
  assert.deepEqual(explicit.selected_skills, ["accessibility"]);
  assert.equal(nextCycleStep(explicit).skill, "accessibility");
  const done = completeCycleStep(explicit, { skill: "accessibility", runId: "run-a11y-0001" });
  assert.equal(done.status, "completed");
  assert.equal(validateCycleState(done).valid, true);
});

test("orchestrated cycle honors pipeline prerequisites", () => {
  let state = createCycleState({ goal: "Assess a release", selectedSkills: ["plan", "review-plan", "automation-strategy", "report"] });
  for (const skill of ["plan", "review-plan", "automation-strategy", "report"]) {
    assert.equal(nextCycleStep(state).skill, skill);
    state = completeCycleStep(state, { skill, runId: `run-${skill}-0001` });
  }
  assert.equal(nextCycleStep(state).status, "completed");
});
