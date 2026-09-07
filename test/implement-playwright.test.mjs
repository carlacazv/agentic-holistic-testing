import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { RunStore } from "../src/core/run-store.mjs";
import {
  PLAYWRIGHT_REQUIRED_ARTIFACTS,
  inferredLocatorFiles,
  implementationCompletionGaps,
  implementationSourceChecksum,
  validatePlaywrightImplementation,
  verificationFromPlaywrightReport,
  verificationOutcome,
  writePlaywrightImplementation,
} from "../src/stages/implement-playwright.mjs";

function fixtureSource(name) {
  return readFile(path.join("test/fixtures/playwright", name), "utf8");
}

async function implementationFixture() {
  const manifest = {
    candidates: [
      { test_case_id: "case-api", decision: "automate", approved: true, recommended_level: "api" },
      { test_case_id: "case-browser", decision: "automate", approved: true, recommended_level: "browser-e2e" }
    ],
    files: [
      { path: "tests/items/api.spec.ts", candidate_ids: ["case-api"], source: await fixtureSource("tests/items/api.spec.ts") },
      {
        path: "tests/pom/items.page.ts",
        kind: "page-object",
        locator_evidence: "live-snapshot",
        source: await fixtureSource("tests/pom/items.page.ts")
      },
      {
        path: "tests/items/browser.spec.ts",
        candidate_ids: ["case-browser"],
        ui_abstraction: "page-object",
        source: await fixtureSource("tests/items/browser.spec.ts")
      }
    ],
    configuration: { reporters: ["html", "json", "junit"], artifacts: ["trace", "screenshot", "video"] },
    ci_integration: { command: "npm run test:playwright:fixture" },
    findings: [],
    verification_results: {
      tests: 2, repetitions: 3, retries: 0, passed: 6, failed: 0, flaky: 0, skipped: 0,
      executed_command: "npm run test:playwright:fixture",
      report_checksum: `sha256:${"1".repeat(64)}`,
      evidence_source: "playwright-json",
    }
  };
  manifest.verification_results.source_checksum = implementationSourceChecksum(manifest);
  return manifest;
}

function refreshVerification(manifest) {
  manifest.verification_results.source_checksum = implementationSourceChecksum(manifest);
  return manifest;
}

function browserFile(manifest) {
  return manifest.files.find((file) => file.path === "tests/items/browser.spec.ts");
}

function reporterFixture(browserStatuses = ["passed", "passed", "passed"]) {
  const testEntry = (status) => ({ projectName: "chromium", results: [{ status }] });
  return {
    config: { retries: 0 },
    suites: [{ title: "items", specs: [
      { file: "tests/items/api.spec.ts", title: "api", tests: [testEntry("passed"), testEntry("passed"), testEntry("passed")] },
      { file: "tests/items/browser.spec.ts", title: "browser", tests: browserStatuses.map(testEntry) },
    ] }],
  };
}

test("approved fixture implementation satisfies quality gates", async () => {
  assert.deepEqual(validatePlaywrightImplementation(await implementationFixture()), { valid: true, errors: [] });
});

test("Playwright JSON reporter output deterministically creates verification evidence", async () => {
  const manifest = await implementationFixture();
  const report = reporterFixture(["passed", "failed", "passed"]);
  const imported = verificationFromPlaywrightReport(manifest, report, manifest.ci_integration.command);
  assert.equal(imported.tests, 2);
  assert.equal(imported.repetitions, 3);
  assert.equal(imported.failed, 1);
  assert.equal(imported.evidence_source, "playwright-json");
  manifest.verification_results = imported;
  assert.equal(validatePlaywrightImplementation(manifest).valid, true);
});

test("unapproved, sleep-based, and inaccessible implementations fail", async () => {
  const manifest = await implementationFixture();
  manifest.candidates[0].approved = false;
  browserFile(manifest).source = "test('bad', async ({ page }) => { await page.waitForTimeout(1000); await page.locator('.item').click(); });";
  manifest.files = manifest.files.filter((file) => file.kind !== "page-object");
  manifest.verification_results.flaky = 1;
  const errors = validatePlaywrightImplementation(manifest).errors.join("\n");
  assert.match(errors, /not approved/);
  assert.match(errors, /fixed waits/);
  assert.match(errors, /accessible locator/);
  assert.equal(verificationOutcome(manifest), "inconclusive");
  assert.equal(implementationCompletionGaps(manifest).length, 1);
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
  file.locator_evidence = "live-snapshot";
  manifest.findings = [{
    id: "finding-001",
    category: "locator",
    target: "tests/items/browser.spec.ts",
    summary: "Position is the behavior under test for the first list entry",
    source_change_approved: false,
  }];
  assert.deepEqual(validatePlaywrightImplementation(refreshVerification(manifest)).errors, []);
});

test("page and component objects must stay free of assertions and tests", async () => {
  const withAssertion = await implementationFixture();
  withAssertion.files[1].source += `\nexport const check = async (l) => { await expect(l).toBeVisible(); };\n`;
  assert.match(
    validatePlaywrightImplementation(withAssertion).errors.join("\n"),
    /page-object must not contain assertions/,
  );

  const asSpec = await implementationFixture();
  asSpec.files[1].path = "tests/items/items.spec.ts";
  assert.match(
    validatePlaywrightImplementation(asSpec).errors.join("\n"),
    /a page-object belongs at tests\/pom\/<name>\.page\.ts/,
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

  const inline = await implementationFixture();
  browserFile(inline).ui_abstraction = "inline";
  browserFile(inline).ui_abstraction_rationale = "one small flow";
  assert.match(
    validatePlaywrightImplementation(inline).errors.join("\n"),
    /ui_abstraction: expected one of page-object, component-object/,
  );
});

test("implementation evidence finalizes", async (t) => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-playwright-"));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const store = new RunStore({ workspace, runId: "run-playwright-0001" });
  await store.initialize();
  assert.equal((await writePlaywrightImplementation(store, await implementationFixture(), { runnerReport: reporterFixture() })).length, 2);
  const result = await store.finalize({ skill: "implement-playwright", status: "completed", requiredArtifacts: PLAYWRIGHT_REQUIRED_ARTIFACTS });
  assert.equal(result.envelope.status, "completed");
  assert.deepEqual(result.envelope.artifacts.map((item) => item.path), [...PLAYWRIGHT_REQUIRED_ARTIFACTS]);
});

test("implementation writer rejects hand-authored verification without raw runner evidence", async (t) => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-playwright-"));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const store = new RunStore({ workspace, runId: "run-playwright-no-report-0001" });
  await store.initialize();
  await assert.rejects(writePlaywrightImplementation(store, await implementationFixture()), /runner report is required/);
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

test("comments cannot impersonate tests and product failures remain valid evidence", async () => {
  const commentsOnly = await implementationFixture();
  commentsOnly.candidates = [commentsOnly.candidates[0]];
  commentsOnly.files = [{
    path: "tests/items/fake.spec.ts", candidate_ids: ["case-api"],
    source: "// test('fake', () => {});\n// request.get('/items');\n// test.step('Should pass', () => {});",
  }];
  commentsOnly.verification_results.tests = 1;
  commentsOnly.verification_results.passed = 3;
  refreshVerification(commentsOnly);
  assert.match(validatePlaywrightImplementation(commentsOnly).errors.join("\n"), /executable test declaration required/);

  const failed = await implementationFixture();
  failed.verification_results.passed = 5;
  failed.verification_results.failed = 1;
  assert.equal(validatePlaywrightImplementation(failed).valid, true);
  assert.equal(verificationOutcome(failed), "fail");
  assert.deepEqual(implementationCompletionGaps(failed), []);
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
    target: "tests/items/browser.spec.ts",
    summary: "Offline feed suite is blocked on a missing stub",
    source_change_approved: false,
  }];
  assert.deepEqual(validatePlaywrightImplementation(refreshVerification(excluded)).errors, []);
});

test("reported test counts must cover every declared spec", async () => {
  const manifest = await implementationFixture();
  manifest.verification_results.tests = 1;
  manifest.verification_results.passed = 3;
  assert.match(
    validatePlaywrightImplementation(manifest).errors.join("\n"),
    /\/verification_results\/tests: fewer executed tests than declared spec files/,
  );
});

test("every file sits where its kind belongs", async () => {
  const cases = [
    ["tests/api.spec.ts", 0, /a spec belongs at tests\/<feature>\/<name>\.spec\.ts/],
    ["tests/pom/api.spec.ts", 0, /a spec belongs at tests\/<feature>\/<name>\.spec\.ts/],
    ["tests/items/deep/api.spec.ts", 0, /a spec belongs at tests\/<feature>\/<name>\.spec\.ts/],
    ["tests/items/items.page.ts", 1, /a page-object belongs at tests\/pom\/<name>\.page\.ts/],
    ["tests/pom/items.ts", 1, /a page-object belongs at tests\/pom\/<name>\.page\.ts/],
  ];
  for (const [replacement, index, expected] of cases) {
    const manifest = await implementationFixture();
    manifest.files[index].path = replacement;
    assert.match(validatePlaywrightImplementation(manifest).errors.join("\n"), expected);
  }

  const component = await implementationFixture();
  component.files[1].kind = "component-object";
  component.files[1].path = "tests/pom/items.component.ts";
  browserFile(component).ui_abstraction = "component-object";
  assert.deepEqual(validatePlaywrightImplementation(refreshVerification(component)).errors, []);
});

test("a file that declares locators declares where they came from", async () => {
  const undeclared = await implementationFixture();
  delete undeclared.files[1].locator_evidence;
  assert.match(
    validatePlaywrightImplementation(undeclared).errors.join("\n"),
    /\/files\/tests\/pom\/items\.page\.ts\/locator_evidence: expected one of live-snapshot, inferred/,
  );

  const guessed = await implementationFixture();
  guessed.files[1].locator_evidence = "guessed";
  assert.match(validatePlaywrightImplementation(guessed).errors.join("\n"), /locator_evidence: expected one of/);

  const inferred = await implementationFixture();
  inferred.files[1].locator_evidence = "inferred";
  assert.deepEqual(validatePlaywrightImplementation(refreshVerification(inferred)).errors, []);
  assert.deepEqual(inferredLocatorFiles(inferred), ["tests/pom/items.page.ts"]);
  assert.match(implementationCompletionGaps(inferred).join("\n"), /Locator evidence is inferred/);
  assert.deepEqual(inferredLocatorFiles(await implementationFixture()), []);
});
