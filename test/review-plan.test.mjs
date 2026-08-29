import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { RunStore } from "../src/core/run-store.mjs";
import {
  REVIEW_PLAN_REQUIRED_ARTIFACTS,
  reviewPlan,
  writeReviewPlanArtifacts,
} from "../src/stages/review-plan.mjs";

async function reviewFixture() {
  const after = JSON.parse(await readFile("test/fixtures/plan-bundle.valid.json", "utf8"));
  const before = structuredClone(after);
  before.requirement_test_links = before.requirement_test_links.filter((link) => link.requirement_id !== "req-status");
  return {
    before,
    after,
    findings: [{ id: "finding-trace", severity: "high", target: "req-status", summary: "Requirement has no test link", status: "resolved", unblocker: "" }],
    modifications: [{ id: "mod-link", finding_id: "finding-trace", operation: "add", target: "requirement_test_links", before: "unlinked req-status", after: "three req-status links", rationale: "Restore accepted requirement coverage" }],
  };
}

test("review proves seeded coverage improvement", async () => {
  const result = reviewPlan(await reviewFixture());
  assert.equal(result.valid, true);
  assert.equal(result.before_metrics.requirements_test_linked_percent, 50);
  assert.equal(result.after_metrics.requirements_test_linked_percent, 100);
  assert.notEqual(result.checksums.before, result.checksums.after);
  assert.match(result.before_validation_errors.join("\n"), /req-status/);
});

test("review rejects invalid after plans and untraceable fixes", async () => {
  const review = await reviewFixture();
  review.after.risks[0].priority = "P3";
  review.modifications = [];
  const errors = reviewPlan(review).errors.join("\n");
  assert.match(errors, /priority/);
  assert.match(errors, /resolved finding requires/);
});

test("review artifacts finalize with checksums", async (t) => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-review-"));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const store = new RunStore({ workspace, runId: "run-review-fixture-01" });
  await store.initialize();
  const artifacts = await writeReviewPlanArtifacts(store, await reviewFixture());
  assert.equal(artifacts.length, REVIEW_PLAN_REQUIRED_ARTIFACTS.length);
  const finalized = await store.finalize({
    skill: "review-plan",
    status: "completed",
    requiredArtifacts: REVIEW_PLAN_REQUIRED_ARTIFACTS,
  });
  assert.equal(finalized.envelope.status, "completed");
});
