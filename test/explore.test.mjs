import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { RunStore } from "../src/core/run-store.mjs";
import { explorationMarkdown, explorationMetrics, explorationRequiredArtifacts, reconcileExecutionsWithPlan, validateExplorationSession, writeExplorationSession } from "../src/stages/explore.mjs";

function fixture() {
  return {
    charter: {
      mission: "Explore item creation failures and recovery",
      timebox_minutes: 30,
      environment: "test",
      heuristics: [
        { name: "SFDIPOT", rationale: "Data, interfaces, operations, and time shape item creation." },
        { name: "FEW HICCUPPS", rationale: "Compare behavior with requirements, user expectations, and product history." }
      ]
    },
    notes: [{ id: "note-1", timestamp: "2026-08-29T15:00:00Z", type: "observation", content: "Duplicate submission created two items." }],
    coverage: [
      { area: "duplicate submission", depth: "deep", gap: "false", notes: "Repeated via browser and API." },
      { area: "network loss", depth: "none", gap: "true", notes: "Proxy capability unavailable." }
    ],
    evidence: [{ id: "evidence-1", type: "trace", raw_path: "test-results/run/trace.zip", durable_path: "qa/runs/run/explore/trace-summary.md", checksum: `sha256:${"0".repeat(64)}`, confidence: "high", linked_record: "defect-duplicate" }],
    defects: [{
      id: "defect-duplicate", status: "confirmed", title: "Duplicate submission creates two items",
      environment: "test", preconditions: "An empty item list", steps: ["Submit the same item twice rapidly"],
      expected: "One item is created", actual: "Two items are created", reproducibility: "3 of 3",
      severity_rationale: "Duplicate records require cleanup", evidence_ids: ["evidence-1"]
    }]
  };
}

test("valid exploration session is reproducible and traceable", () => {
  assert.deepEqual(validateExplorationSession(fixture()), { valid: true, errors: [] });
  assert.deepEqual(explorationRequiredArtifacts(fixture()).at(-1), "explore/defects/defect-duplicate/reproduction.md");
});

test("confirmed defects without evidence are rejected", () => {
  const session = fixture();
  session.defects[0].evidence_ids = [];
  assert.match(validateExplorationSession(session).errors.join("\n"), /confirmed defect requires evidence/);
});

test("exploration artifacts finalize", async (t) => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-explore-"));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const store = new RunStore({ workspace, runId: "run-explore-0001" });
  await store.initialize();
  const session = fixture();
  assert.equal((await writeExplorationSession(store, session)).length, 3);
  const result = await store.finalize({ skill: "explore", status: "completed", requiredArtifacts: explorationRequiredArtifacts(session) });
  assert.equal(result.envelope.status, "completed");
  assert.deepEqual(result.envelope.artifacts.map((item) => item.path), explorationRequiredArtifacts(session).sort());
});

test("case executions trace outcomes to defects and evidence", () => {
  const session = fixture();
  session.executions = [
    { case_id: "TC-1", status: "fail", notes: "Two items created.", evidence_ids: ["evidence-1"], defect_ids: ["defect-duplicate"] },
    { case_id: "TC-2", status: "not-run", notes: "Needs a slot less than 90 minutes away; none exist outside business hours." },
  ];
  assert.deepEqual(validateExplorationSession(session), { valid: true, errors: [] });
  const metrics = explorationMetrics(session);
  assert.equal(metrics.executions_total, 2);
  assert.equal(metrics.executions_run, 1);
  assert.equal(metrics.executions_fail, 1);
  assert.equal(metrics.executions_not_run, 1);
  assert.match(explorationMarkdown(session), /## Case executions/);
});

test("a failed execution without a linked defect is rejected", () => {
  const session = fixture();
  session.executions = [{ case_id: "TC-1", status: "fail", notes: "Broken." }];
  assert.match(validateExplorationSession(session).errors.join("\n"), /failed execution requires a linked defect/);
});

test("executions must reference defined evidence, defects, and statuses", () => {
  const session = fixture();
  session.executions = [
    { case_id: "TC-1", status: "maybe", notes: "x", evidence_ids: ["ghost"], defect_ids: ["defect-ghost"] },
    { case_id: "TC-1", status: "pass", notes: "again", defect_ids: ["defect-duplicate"] },
  ];
  const errors = validateExplorationSession(session).errors.join("\n");
  assert.match(errors, /unknown status/);
  assert.match(errors, /unknown ghost/);
  assert.match(errors, /unknown defect-ghost/);
  assert.match(errors, /duplicate case execution/);
});

test("executions reconcile against the plan and surface unrecorded cases", () => {
  const session = fixture();
  session.executions = [
    { case_id: "TC-1", status: "pass", notes: "ok" },
    { case_id: "TC-9", status: "pass", notes: "not in plan" },
  ];
  const plan = { test_cases: [{ id: "TC-1" }, { id: "TC-2" }] };
  assert.deepEqual(reconcileExecutionsWithPlan(session, plan), {
    valid: false, errors: ["/executions/TC-9: unknown plan case"], unrecorded_case_ids: ["TC-2"],
  });
});

test("a finding that is not a defect must name the oracle that decided it", () => {
  const session = fixture();
  session.defects[0].classification = "accepted-deviation";
  assert.match(validateExplorationSession(session).errors.join("\n"), /accepted-deviation requires the oracle sources/);
  session.defects[0].oracle_sources = ["Story approval comment accepting the deviation"];
  assert.deepEqual(validateExplorationSession(session).errors, []);
  assert.equal(explorationMetrics(session).findings_accepted_deviation, 1);
  assert.equal(explorationMetrics(session).defects_confirmed, 0);
});

test("tracker references and causes are validated and rendered", async (t) => {
  const session = fixture();
  session.defects[0].tracker_refs = [{ ref: "tracker#101", relation: "sideways" }];
  assert.match(validateExplorationSession(session).errors.join("\n"), /unknown relation/);
  session.defects[0].tracker_refs = [{ ref: "tracker#101", relation: "duplicate" }];
  session.defects[0].component = "backend API";
  session.defects[0].cause = "Handler inserts before checking the idempotency key.";
  session.defects[0].cause_evidence_ids = ["evidence-1"];
  assert.deepEqual(validateExplorationSession(session).errors, []);
  assert.equal(explorationMetrics(session).defects_with_tracker_duplicate, 1);

  const workspace = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-explore-"));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const store = new RunStore({ workspace, runId: "run-explore-0002" });
  await store.initialize();
  await writeExplorationSession(store, session);
  const { readFile } = await import("node:fs/promises");
  const reproduction = await readFile(path.join(workspace, "qa/runs/run-explore-0002/explore/defects/defect-duplicate/reproduction.md"), "utf8");
  assert.match(reproduction, /duplicate: tracker#101/);
  assert.match(reproduction, /Component: backend API/);
});

test("sessions without reconciliation fields keep their previous meaning", () => {
  const metrics = explorationMetrics(fixture());
  assert.equal(metrics.findings_defect, 1);
  assert.equal(metrics.defects_confirmed, 1);
  assert.equal(metrics.executions_total, 0);
});
