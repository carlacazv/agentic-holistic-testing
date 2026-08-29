import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { RunStore } from "../src/core/run-store.mjs";
import {
  PLAYWRIGHT_REQUIRED_ARTIFACTS,
  validatePlaywrightImplementation,
  writePlaywrightImplementation,
} from "../src/stages/implement-playwright.mjs";

async function implementationFixture() {
  return {
    candidates: [
      { test_case_id: "case-api", decision: "automate", approved: true, recommended_level: "api" },
      { test_case_id: "case-browser", decision: "automate", approved: true, recommended_level: "browser-e2e" }
    ],
    files: [
      { path: "tests/api.spec.ts", candidate_ids: ["case-api"], source: await readFile("test/fixtures/playwright/api.spec.ts", "utf8") },
      { path: "tests/browser.spec.ts", candidate_ids: ["case-browser"], source: await readFile("test/fixtures/playwright/browser.spec.ts", "utf8") }
    ],
    configuration: { reporters: ["html", "json", "junit"], artifacts: ["trace", "screenshot", "video"] },
    ci_integration: { command: "npm run test:playwright:fixture" },
    findings: [],
    verification_results: { tests: 2, repetitions: 3, retries: 0, passed: 6, failed: 0, flaky: 0 }
  };
}

test("approved fixture implementation satisfies quality gates", async () => {
  assert.deepEqual(validatePlaywrightImplementation(await implementationFixture()), { valid: true, errors: [] });
});

test("unapproved, sleep-based, and inaccessible implementations fail", async () => {
  const manifest = await implementationFixture();
  manifest.candidates[0].approved = false;
  manifest.files[1].source = "test('bad', async ({ page }) => { await page.waitForTimeout(1000); await page.locator('.item').click(); });";
  manifest.verification_results.flaky = 1;
  const errors = validatePlaywrightImplementation(manifest).errors.join("\n");
  assert.match(errors, /not approved/);
  assert.match(errors, /fixed waits/);
  assert.match(errors, /accessible locator/);
  assert.match(errors, /flaky/);
});

test("implementation evidence finalizes", async (t) => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-playwright-"));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const store = new RunStore({ workspace, runId: "run-playwright-0001" });
  await store.initialize();
  assert.equal((await writePlaywrightImplementation(store, await implementationFixture())).length, 3);
  const result = await store.finalize({ skill: "implement-playwright", status: "completed", requiredArtifacts: PLAYWRIGHT_REQUIRED_ARTIFACTS });
  assert.equal(result.envelope.status, "completed");
});
