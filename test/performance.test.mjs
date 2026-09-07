import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { RunStore } from "../src/core/run-store.mjs";
import { distribution, evaluateBudgets, performanceRequiredArtifacts, validatePerformanceAudit, writePerformanceAudit } from "../src/stages/performance.mjs";

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
  assert.equal((await writePerformanceAudit(store, audit)).length, 2);
  const result = await store.finalize({ skill: "performance", status: "completed", requiredArtifacts: performanceRequiredArtifacts(audit), residualRisks: ["No SLA was supplied"] });
  assert.equal(result.envelope.status, "completed");
  const document = JSON.parse(await readFile(path.join(store.durableDirectory, "performance/audit.json"), "utf8"));
  assert.match(document.uncertainty, /No SLA/);
  assert.equal(document.api_timings[0].summary.samples, audit.api_timings[0].samples_ms.length);
});

test("an unrecognized budget direction is rejected and never passes", () => {
  const audit = fixture("budget");
  audit.budgets[0].direction = "maximum";
  audit.lighthouse_runs = audit.lighthouse_runs.map((run) => ({ ...run, metrics: { ...run.metrics, lcp_ms: 9000 } }));
  assert.equal(evaluateBudgets(audit)[0].passed, false);
  const errors = validatePerformanceAudit(audit).errors.join("\n");
  assert.match(errors, /\/budgets\/budget-lcp\/direction: expected one of max, min/);
});

test("budget fields are declared before a threshold is compared", () => {
  const audit = fixture("budget");
  audit.budgets[0] = { ...audit.budgets[0], source: "lighthouse-api", metric: "", statistic: "samples", threshold: "1150", unit: "" };
  const errors = validatePerformanceAudit(audit).errors.join("\n");
  for (const field of ["source", "metric", "statistic", "threshold", "unit"]) {
    assert.match(errors, new RegExp(`/budgets/budget-lcp/${field}:`));
  }
});

test("repeated runs are required for every declared page", () => {
  const audit = fixture();
  audit.scope.pages = ["/", "/second"];
  audit.lighthouse_runs = [...audit.lighthouse_runs, { page: "/second", metrics: { performance_score: 1, lcp_ms: 900, cls: 0, tbt_ms: 0 } }];
  assert.match(
    validatePerformanceAudit(audit).errors.join("\n"),
    /\/lighthouse_runs: page \/second requires at least three comparable runs/,
  );
});
