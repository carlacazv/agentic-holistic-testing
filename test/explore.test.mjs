import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { RunStore } from "../src/core/run-store.mjs";
import { explorationRequiredArtifacts, validateExplorationSession, writeExplorationSession } from "../src/stages/explore.mjs";

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
  assert.equal((await writeExplorationSession(store, session)).length, 5);
  const result = await store.finalize({ skill: "explore", status: "completed", requiredArtifacts: explorationRequiredArtifacts(session) });
  assert.equal(result.envelope.status, "completed");
});
