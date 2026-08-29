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

function fixtureSource(name) {
  return readFile(path.join("test/fixtures/playwright", name), "utf8");
}

async function implementationFixture() {
  return {
    candidates: [
      { test_case_id: "case-api", decision: "automate", approved: true, recommended_level: "api" },
      { test_case_id: "case-browser", decision: "automate", approved: true, recommended_level: "browser-e2e" }
    ],
    files: [
      { path: "tests/api.spec.ts", candidate_ids: ["case-api"], source: await fixtureSource("api.spec.ts") },
      { path: "tests/pages/items.page.ts", kind: "page-object", source: await fixtureSource("pages/items.page.ts") },
      {
        path: "tests/browser.spec.ts",
        candidate_ids: ["case-browser"],
        ui_abstraction: "page-object",
        source: await fixtureSource("browser.spec.ts")
      }
    ],
    configuration: { reporters: ["html", "json", "junit"], artifacts: ["trace", "screenshot", "video"] },
    ci_integration: { command: "npm run test:playwright:fixture" },
    findings: [],
    verification_results: { tests: 2, repetitions: 3, retries: 0, passed: 6, failed: 0, flaky: 0 }
  };
}

function browserFile(manifest) {
  return manifest.files.find((file) => file.path === "tests/browser.spec.ts");
}

test("approved fixture implementation satisfies quality gates", async () => {
  assert.deepEqual(validatePlaywrightImplementation(await implementationFixture()), { valid: true, errors: [] });
});

test("unapproved, sleep-based, and inaccessible implementations fail", async () => {
  const manifest = await implementationFixture();
  manifest.candidates[0].approved = false;
  browserFile(manifest).source = "test('bad', async ({ page }) => { await page.waitForTimeout(1000); await page.locator('.item').click(); });";
  manifest.files = manifest.files.filter((file) => file.kind !== "page-object");
  browserFile(manifest).ui_abstraction = "inline";
  browserFile(manifest).ui_abstraction_rationale = "single flow";
  manifest.verification_results.flaky = 1;
  const errors = validatePlaywrightImplementation(manifest).errors.join("\n");
  assert.match(errors, /not approved/);
  assert.match(errors, /fixed waits/);
  assert.match(errors, /accessible locator/);
  assert.match(errors, /flaky/);
});

test("Given/When describes and Should steps are enforced", async () => {
  const manifest = await implementationFixture();
  browserFile(manifest).source = `
    test.describe("adds an item", () => {
      test("case-browser", async ({ page }) => {
        await test.step("checks the list", async () => {
          await expect(page.getByRole("list")).toContainText("Browser item");
        });
      });
    });
  `;
  const errors = validatePlaywrightImplementation(manifest).errors.join("\n");
  assert.match(errors, /describe title must start with "Given " or "When "/);
  assert.match(errors, /step title must start with "Should "/);

  const withoutSteps = await implementationFixture();
  browserFile(withoutSteps).source = `
    test.describe("Given a list", () => {
      test.describe("When adding", () => {
        test("case-browser", async ({ page }) => {
          await expect(page.getByRole("list")).toContainText("Browser item");
        });
      });
    });
  `;
  assert.match(
    validatePlaywrightImplementation(withoutSteps).errors.join("\n"),
    /assertions must be wrapped in test\.step/,
  );
});

test("flake-prone patterns are rejected", async () => {
  const patterns = [
    ['await page.waitForLoadState("networkidle");', /networkidle waits are prohibited/],
    ["const handle = await page.getByRole('list').elementHandle();", /element handles are prohibited/],
    ["expect(await page.getByRole('list').isVisible()).toBe(true);", /sampled state assertions are prohibited/],
    ["await page.getByRole('listitem').first().click();", /positional locator requires a finding/],
    ["test.skip(true, 'unstable');", /skipped test requires an exclusion finding/],
  ];
  for (const [snippet, expected] of patterns) {
    const manifest = await implementationFixture();
    const file = browserFile(manifest);
    file.source = `${file.source}\n${snippet}\n`;
    assert.match(validatePlaywrightImplementation(manifest).errors.join("\n"), expected);
  }
});

test("positional locators and exclusions pass once a finding records them", async () => {
  const manifest = await implementationFixture();
  const file = browserFile(manifest);
  file.source = `${file.source}\nawait items.list.getByRole("listitem").first().click();\n`;
  manifest.findings = [{
    id: "finding-001",
    category: "locator",
    target: "tests/browser.spec.ts",
    summary: "Position is the behavior under test for the first list entry",
    source_change_approved: false,
  }];
  assert.deepEqual(validatePlaywrightImplementation(manifest).errors, []);
});

test("page and component objects must stay free of assertions and tests", async () => {
  const withAssertion = await implementationFixture();
  withAssertion.files[1].source += `\nexport const check = async (l) => { await expect(l).toBeVisible(); };\n`;
  assert.match(
    validatePlaywrightImplementation(withAssertion).errors.join("\n"),
    /page-object must not contain assertions/,
  );

  const asSpec = await implementationFixture();
  asSpec.files[1].path = "tests/pages/items.spec.ts";
  assert.match(
    validatePlaywrightImplementation(asSpec).errors.join("\n"),
    /page-object must not be a \.spec\.ts file/,
  );
});

test("the UI abstraction decision is explicit and consistent", async () => {
  const undeclared = await implementationFixture();
  delete browserFile(undeclared).ui_abstraction;
  assert.match(validatePlaywrightImplementation(undeclared).errors.join("\n"), /ui_abstraction: expected one of/);

  const missingObject = await implementationFixture();
  missingObject.files = missingObject.files.filter((file) => file.kind !== "page-object");
  assert.match(
    validatePlaywrightImplementation(missingObject).errors.join("\n"),
    /declares page-object but no such file is provided/,
  );

  const inlineWithoutRationale = await implementationFixture();
  inlineWithoutRationale.files = inlineWithoutRationale.files.filter((file) => file.kind !== "page-object");
  browserFile(inlineWithoutRationale).ui_abstraction = "inline";
  assert.match(
    validatePlaywrightImplementation(inlineWithoutRationale).errors.join("\n"),
    /inline abstraction requires a rationale/,
  );

  const inlineWithTwoBrowserCandidates = await implementationFixture();
  inlineWithTwoBrowserCandidates.candidates.push({
    test_case_id: "case-browser-2", decision: "automate", approved: true, recommended_level: "browser-e2e",
  });
  browserFile(inlineWithTwoBrowserCandidates).candidate_ids = ["case-browser", "case-browser-2"];
  browserFile(inlineWithTwoBrowserCandidates).ui_abstraction = "inline";
  browserFile(inlineWithTwoBrowserCandidates).ui_abstraction_rationale = "one small flow";
  assert.match(
    validatePlaywrightImplementation(inlineWithTwoBrowserCandidates).errors.join("\n"),
    /more than one browser candidate requires a page or component object/,
  );
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

test("an empty implementation cannot claim completion", () => {
  const errors = validatePlaywrightImplementation({
    candidates: [],
    files: [],
    configuration: { reporters: ["html", "json", "junit"], artifacts: ["trace", "screenshot", "video"] },
    ci_integration: { command: "npx playwright test" },
    verification_results: { tests: 0, repetitions: 3, retries: 0, passed: 0, failed: 0, flaky: 0 },
  }).errors.join("\n");
  assert.match(errors, /\/candidates: at least one approved candidate is required/);
  assert.match(errors, /\/files: at least one spec file is required/);
  assert.match(errors, /\/verification_results\/tests: expected a positive integer/);
});

test("suite-level exclusions and focused tests are rejected", async () => {
  const cases = [
    ['test.describe.skip("When loading", () => {});', /skipped test requires an exclusion finding/],
    ['test.describe.fixme("When loading", () => {});', /skipped test requires an exclusion finding/],
    ['test.only("case-browser", async () => {});', /focused tests are prohibited/],
    ['test.describe.only("Given a list", () => {});', /focused tests are prohibited/],
  ];
  for (const [snippet, expected] of cases) {
    const manifest = await implementationFixture();
    const file = browserFile(manifest);
    file.source = `${file.source}\n${snippet}\n`;
    assert.match(validatePlaywrightImplementation(manifest).errors.join("\n"), expected);
  }

  const excluded = await implementationFixture();
  const file = browserFile(excluded);
  file.source = `${file.source}\ntest.describe.skip("When the feed is offline", () => {});\n`;
  excluded.findings = [{
    id: "finding-002",
    category: "exclusion",
    target: "tests/browser.spec.ts",
    summary: "Offline feed suite is blocked on a missing stub",
    source_change_approved: false,
  }];
  assert.deepEqual(validatePlaywrightImplementation(excluded).errors, []);
});

test("reported test counts must cover every declared spec", async () => {
  const manifest = await implementationFixture();
  manifest.verification_results = { tests: 1, repetitions: 3, retries: 0, passed: 3, failed: 0, flaky: 0 };
  assert.match(
    validatePlaywrightImplementation(manifest).errors.join("\n"),
    /\/verification_results\/tests: fewer executed tests than declared spec files/,
  );
});
