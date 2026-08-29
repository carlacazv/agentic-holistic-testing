import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { RunStore } from "../src/core/run-store.mjs";
import { distribution, performanceRequiredArtifacts, validatePerformanceAudit, writePerformanceAudit } from "../src/stages/performance.mjs";

function fixture(mode = "baseline") {
  return {
    mode,
    scope: { pages: ["/"], endpoints: ["/api/items"], environment: "test", conditions: "Local Chrome, stable fixture data" },
    budgets: mode === "budget" ? [{ id: "budget-lcp", source: "lighthouse", target: "/", metric: "lcp_ms", statistic: "median", direction: "max", threshold: 1150, unit: "ms" }] : [],
    lighthouse_runs: [
      { page: "/", metrics: { performance_score: 0.99, lcp_ms: 1000, cls: 0, tbt_ms: 0 } },
      { page: "/", metrics: { performance_score: 1, lcp_ms: 1100, cls: 0, tbt_ms: 0 } },
      { page: "/", metrics: { performance_score: 0.99, lcp_ms: 1200, cls: 0, tbt_ms: 0 } }
    ],
    api_timings: [{ endpoint: "/api/items", samples_ms: [8, 10, 12, 9, 11], errors: [] }],
    variability_notes: "LCP range is 200 ms; local results are a mechanics baseline only.",
    regressions: [],
    defects: []
  };
}

test("distribution and budget boundaries are deterministic", () => {
  assert.deepEqual(distribution([8, 10, 12, 9, 11]), { samples: 5, min: 8, median: 10, p95: 12, max: 12 });
  assert.deepEqual(validatePerformanceAudit(fixture("budget")).errors, []);
});

test("failed budgets require a linked defect and baseline cannot invent budgets", () => {
  const failed = fixture("budget");
  failed.budgets[0].threshold = 1050;
  assert.match(validatePerformanceAudit(failed).errors.join("\n"), /requires linked defect/);
  const invented = fixture("baseline");
  invented.budgets = failed.budgets;
  assert.match(validatePerformanceAudit(invented).errors.join("\n"), /must not invent thresholds/);
});

test("baseline artifacts preserve uncertainty and finalize", async (t) => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-performance-"));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const store = new RunStore({ workspace, runId: "run-performance-0001" });
  await store.initialize();
  const audit = fixture();
  assert.equal((await writePerformanceAudit(store, audit)).length, 7);
  const result = await store.finalize({ skill: "performance", status: "completed", requiredArtifacts: performanceRequiredArtifacts(audit), residualRisks: ["No SLA was supplied"] });
  assert.equal(result.envelope.status, "completed");
});
