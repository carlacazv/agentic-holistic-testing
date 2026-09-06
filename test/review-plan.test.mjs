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
    mode: "apply",
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

test("resolved findings require an actual plan change", async () => {
  const review = await reviewFixture();
  review.before = structuredClone(review.after);
  review.modifications = [{
    id: "mod-fake", finding_id: "finding-trace", operation: "update",
    target: "missing-record", before: "a", after: "b", rationale: "Claimed change",
  }];
  const errors = reviewPlan(review).errors.join("\n");
  assert.match(errors, /real change/);
  assert.match(errors, /missing-record does not identify/);
});

test("review artifacts finalize with checksums", async (t) => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-review-"));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const store = new RunStore({ workspace, runId: "run-review-fixture-01" });
  await store.initialize();
  const artifacts = await writeReviewPlanArtifacts(store, await reviewFixture());
  assert.deepEqual(artifacts.map((artifact) => artifact.path), [...REVIEW_PLAN_REQUIRED_ARTIFACTS]);
  const finalized = await store.finalize({
    skill: "review-plan",
    status: "completed",
    requiredArtifacts: REVIEW_PLAN_REQUIRED_ARTIFACTS,
  });
  assert.equal(finalized.envelope.status, "completed");
});

test("a structurally unusable bundle blocks instead of crashing the review", async () => {
  const review = await reviewFixture();
  const malformed = reviewPlan({ ...review, before: { ...review.before, requirements: "not-an-array" } });
  assert.equal(malformed.valid, false);
  assert.deepEqual(malformed.errors, ["/before/requirements: expected array"]);
  assert.equal(malformed.before_metrics, null);

  const absent = reviewPlan({ ...review, before: null });
  assert.deepEqual(absent.errors, ["/before: expected a plan bundle object"]);
});

test("dropped test cases require a recorded removal", async () => {
  const review = await reviewFixture();
  const kept = new Set(["case-age-below", "case-age-at", "case-age-above", "case-state"]);
  const dropped = ["case-decision", "case-equivalence", "case-scenario", "case-pairwise", "case-error"];
  review.before = structuredClone(review.after);
  review.after.test_cases = review.after.test_cases.filter((testCase) => kept.has(testCase.id));
  review.after.test_steps = review.after.test_steps.filter((step) => kept.has(step.test_case_id));
  review.after.requirement_test_links = review.after.requirement_test_links.filter((link) => kept.has(link.test_case_id));
  review.after.risk_test_links = review.after.risk_test_links.filter((link) => kept.has(link.test_case_id));
  review.findings = [];
  review.modifications = [];

  const silent = reviewPlan(review);
  assert.equal(silent.valid, false);
  assert.equal(silent.after_metrics.test_cases_total, 4);
  for (const testCase of dropped) {
    assert.match(silent.errors.join("\n"), new RegExp(`/test_cases/${testCase}: removed without a recorded`));
  }

  review.findings = [{ id: "finding-duplication", severity: "medium", target: "test_cases", summary: "Five cases duplicate the boundary group", status: "resolved", unblocker: "" }];
  review.modifications = dropped.map((testCase) => ({
    id: `mod-${testCase}`,
    finding_id: "finding-duplication",
    operation: "remove",
    target: testCase,
    before: testCase,
    after: "",
    rationale: "Duplicate of the retained boundary coverage",
  }));
  assert.deepEqual(reviewPlan(review).errors, []);
});

test("the review mode is declared rather than assumed", async () => {
  const review = await reviewFixture();
  delete review.mode;
  assert.match(reviewPlan(review).errors.join("\n"), /\/mode: expected one of apply, complement/);
});

test("a complement adds to the plan without touching what is there", async () => {
  const review = await reviewFixture();
  review.mode = "complement";
  review.before = structuredClone(review.after);
  review.after.test_cases.push({
    id: "case-complement",
    title: "Reject a blank age",
    technique: "equivalence-partitioning",
    rationale: "Covers the empty input class",
    boundary_group: "",
    boundary_role: "",
    boundary_value: "",
  });
  review.after.test_steps.push({ id: "step-complement", test_case_id: "case-complement", sequence: 1, action: "Submit a blank age", expected: "The form reports a required field" });
  review.after.requirement_test_links.push({ requirement_id: "req-age", test_case_id: "case-complement" });
  assert.deepEqual(reviewPlan(review).errors, []);

  const removing = structuredClone(review);
  removing.after.test_cases = removing.after.test_cases.filter((testCase) => testCase.id !== "case-scenario");
  assert.match(
    reviewPlan(removing).errors.join("\n"),
    /\/complement\/test_cases\/case-scenario: a complement must not remove an existing record/,
  );

  const rewriting = structuredClone(review);
  rewriting.after.test_cases[0].rationale = "Rewritten during a complement";
  assert.match(
    reviewPlan(rewriting).errors.join("\n"),
    /\/complement\/test_cases\/case-age-below: a complement must not change an existing record/,
  );

  const unlinking = structuredClone(review);
  unlinking.after.risk_test_links = unlinking.after.risk_test_links.slice(1);
  assert.match(
    reviewPlan(unlinking).errors.join("\n"),
    /\/complement\/risk_test_links\/\d+: a complement must not remove an existing link/,
  );
});

test("the review is one readable document plus the plan", async (t) => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-review-md-"));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const store = new RunStore({ workspace, runId: "run-review-fixture-02" });
  await store.initialize();
  await writeReviewPlanArtifacts(store, await reviewFixture());
  const document = await readFile(path.join(workspace, "qa/runs/run-review-fixture-02/review-plan/review.md"), "utf8");
  assert.match(document, /- Mode: apply/);
  assert.match(document, /\| finding-trace \| high \| req-status \| resolved \|/);
  assert.match(document, /\| mod-link \| finding-trace \| add \|/);
  assert.match(document, /\| requirements_test_linked_percent \| 50 \| 100 \|/);
  assert.match(document, /## Remaining gaps\n\nNone\./);
});
