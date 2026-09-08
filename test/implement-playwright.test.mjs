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

function benchmarkSource(name) {
  return readFile(path.join("benchmarks/planning-poker", name), "utf8");
}

async function implementationFixture() {
  const files = [
    {
      path: "tests/items/api/create-item.spec.ts",
      kind: "spec",
      candidate_ids: ["case-api"],
      expected_tests: 1,
      mutates_state: true,
      cleanup_strategy: "after-each",
      source: await fixtureSource("tests/items/api/create-item.spec.ts"),
    },
    {
      path: "pages/items/items.page.ts",
      kind: "page-object",
      locator_evidence: "live-snapshot",
      source: await fixtureSource("pages/items/items.page.ts"),
    },
    {
      path: "fixtures/api/api-fixture.ts",
      kind: "fixture",
      source: await fixtureSource("fixtures/api/api-fixture.ts"),
    },
    {
      path: "fixtures/pom/page-object-fixture.ts",
      kind: "fixture",
      source: await fixtureSource("fixtures/pom/page-object-fixture.ts"),
    },
    {
      path: "fixtures/pom/test-options.ts",
      kind: "fixture",
      source: await fixtureSource("fixtures/pom/test-options.ts"),
    },
    {
      path: "test-data/factories/items/item.factory.ts",
      kind: "factory",
      source: await fixtureSource("test-data/factories/items/item.factory.ts"),
    },
    {
      path: "enums/items/app.ts",
      kind: "enum",
      source: await fixtureSource("enums/items/app.ts"),
    },
    {
      path: "config/app.ts",
      kind: "config",
      source: await fixtureSource("config/app.ts"),
    },
    {
      path: "playwright.config.ts",
      kind: "config",
      source: await fixtureSource("playwright.config.ts"),
    },
    {
      path: "tests/items/e2e/add-item.spec.ts",
      kind: "spec",
      candidate_ids: ["case-browser"],
      expected_tests: 1,
      mutates_state: true,
      cleanup_strategy: "after-each",
      ui_abstraction: "page-object",
      ui_abstraction_paths: ["pages/items/items.page.ts"],
      source: await fixtureSource("tests/items/e2e/add-item.spec.ts"),
    },
  ];
  const manifest = {
    architecture: {
      standard_version: 1,
      profile: "agentic-playwright",
      fixture_import: "fixtures/pom/test-options.ts",
      test_structure: "given-when-should",
    },
    candidates: [
      { test_case_id: "case-api", decision: "automate", approved: true, recommended_level: "api" },
      { test_case_id: "case-browser", decision: "automate", approved: true, recommended_level: "browser-e2e" },
    ],
    files,
    configuration: {
      reporters: ["html", "json", "junit"],
      artifacts: ["trace", "screenshot", "video"],
      quality_gates: ["lint", "typecheck", "playwright"],
      locale: "en-US",
      timezone: "UTC",
      playwright_version: "1.62.1",
    },
    ci_integration: {
      command: "npm run test:playwright:fixture",
      commands: {
        lint: "npm run lint",
        typecheck: "npm run typecheck",
        playwright: "npm run test:playwright:fixture",
      },
    },
    findings: [],
    verification_results: {
      tests: 2,
      repetitions: 3,
      retries: 0,
      passed: 6,
      failed: 0,
      flaky: 0,
      skipped: 0,
      executed_command: "npm run test:playwright:fixture",
      report_checksum: `sha256:${"1".repeat(64)}`,
      evidence_source: "playwright-json",
    },
  };
  manifest.verification_results.source_checksum = implementationSourceChecksum(manifest);
  return manifest;
}

async function planningPokerBenchmark() {
  const supportFiles = [
    ["config/app.ts", "config"],
    ["enums/planning-poker/app.ts", "enum"],
    ["fixtures/helper/helper-fixture.ts", "fixture"],
    ["fixtures/pom/page-object-fixture.ts", "fixture"],
    ["fixtures/pom/test-options.ts", "fixture"],
    ["pages/planning-poker/home.page.ts", "page-object", "live-snapshot"],
    ["pages/planning-poker/room.page.ts", "page-object", "live-snapshot"],
    ["playwright.config.ts", "config"],
    ["test-data/factories/planning-poker/scenario.factory.ts", "factory"],
    ["test-data/static/planning-poker/password-boundaries.ts", "static-data"],
  ];
  const files = await Promise.all(supportFiles.map(async ([filePath, kind, locatorEvidence]) => ({
    path: filePath,
    kind,
    ...(locatorEvidence ? { locator_evidence: locatorEvidence } : {}),
    source: await benchmarkSource(filePath),
  })));
  files.push({
    path: "tests/planning-poker/e2e/estimation.spec.ts",
    kind: "spec",
    candidate_ids: ["TC-JOURNEY"],
    expected_tests: 1,
    mutates_state: true,
    cleanup_strategy: "fixture",
    cleanup_file: "fixtures/helper/helper-fixture.ts",
    ui_abstraction: "page-object",
    ui_abstraction_paths: ["pages/planning-poker/home.page.ts", "pages/planning-poker/room.page.ts"],
    source: await benchmarkSource("tests/planning-poker/e2e/estimation.spec.ts"),
  });
  files.push({
    path: "tests/planning-poker/functional/room-password.spec.ts",
    kind: "spec",
    candidate_ids: ["TC-PASS-5", "TC-PASS-6", "TC-PASS-7"],
    expected_tests: 3,
    mutates_state: true,
    cleanup_strategy: "fixture",
    cleanup_file: "fixtures/helper/helper-fixture.ts",
    ui_abstraction: "page-object",
    ui_abstraction_paths: ["pages/planning-poker/home.page.ts", "pages/planning-poker/room.page.ts"],
    source: await benchmarkSource("tests/planning-poker/functional/room-password.spec.ts"),
  });
  const candidate = (testCaseId) => ({
    test_case_id: testCaseId,
    decision: "automate",
    approved: true,
    recommended_level: "browser-e2e",
  });
  const command = "npx playwright test --repeat-each=3 --retries=0 --workers=1";
  const manifest = {
    architecture: {
      standard_version: 1,
      profile: "agentic-playwright",
      fixture_import: "fixtures/pom/test-options.ts",
      test_structure: "given-when-then",
    },
    candidates: ["TC-JOURNEY", "TC-PASS-5", "TC-PASS-6", "TC-PASS-7"].map(candidate),
    files,
    configuration: {
      reporters: ["html", "json", "junit"],
      artifacts: ["trace", "screenshot", "video"],
      quality_gates: ["lint", "typecheck", "playwright"],
      locale: "pt-BR",
      timezone: "UTC",
      playwright_version: "1.62.1",
    },
    ci_integration: {
      command,
      commands: {
        lint: "npx eslint tests pages fixtures test-data config enums",
        typecheck: "npx tsc --project tsconfig.e2e.json",
        playwright: command,
      },
    },
    findings: [],
    verification_results: {
      tests: 4,
      repetitions: 3,
      retries: 0,
      passed: 12,
      failed: 0,
      flaky: 0,
      skipped: 0,
      executed_command: command,
      report_checksum: `sha256:${"2".repeat(64)}`,
      evidence_source: "playwright-json",
    },
  };
  manifest.verification_results.source_checksum = implementationSourceChecksum(manifest);
  return manifest;
}

function refreshVerification(manifest) {
  manifest.verification_results.source_checksum = implementationSourceChecksum(manifest);
  return manifest;
}

function browserFile(manifest) {
  return manifest.files.find((file) => file.path === "tests/items/e2e/add-item.spec.ts");
}

function pageObjectFile(manifest) {
  return manifest.files.find((file) => file.path === "pages/items/items.page.ts");
}

function reporterFixture(browserStatuses = ["passed", "passed", "passed"]) {
  const testEntry = (status) => ({ projectName: "chromium", results: [{ status }] });
  return {
    config: { retries: 0 },
    suites: [{ title: "items", specs: [
      { file: "tests/items/api/create-item.spec.ts", title: "api", tests: [testEntry("passed"), testEntry("passed"), testEntry("passed")] },
      { file: "tests/items/e2e/add-item.spec.ts", title: "browser", tests: browserStatuses.map(testEntry) },
    ] }],
  };
}

test("the canonical fixture implementation satisfies every quality gate", async () => {
  assert.deepEqual(validatePlaywrightImplementation(await implementationFixture()), { valid: true, errors: [] });
});

test("the merged Planning Poker PR is a golden architecture benchmark", async () => {
  assert.deepEqual(validatePlaywrightImplementation(await planningPokerBenchmark()), { valid: true, errors: [] });
});

test("Playwright JSON evidence preserves product failures", async () => {
  const manifest = await implementationFixture();
  manifest.verification_results = verificationFromPlaywrightReport(
    manifest,
    reporterFixture(["passed", "failed", "passed"]),
    manifest.ci_integration.command,
  );
  assert.equal(manifest.verification_results.failed, 1);
  assert.equal(validatePlaywrightImplementation(manifest).valid, true);
  assert.equal(verificationOutcome(manifest), "fail");
});

test("a monolithic direct-Playwright spec is rejected", async () => {
  const manifest = await implementationFixture();
  browserFile(manifest).source = `
    import { expect, test } from "@playwright/test";
    import { ItemsPage } from "../../../pages/items/items.page";
    test("case-browser", async ({ browser, page }) => {
      const context = await browser.newContext();
      const items = new ItemsPage(page);
      await page.getByRole("button", { name: "Add item" }).click();
      await expect(items.list).toBeVisible();
      await context.close();
    });
  `;
  const errors = validatePlaywrightImplementation(manifest).errors.join("\n");
  assert.match(errors, /import test from fixtures\/pom\/test-options\.ts/);
  assert.match(errors, /exactly one tag/);
  assert.match(errors, /test_case annotation/);
  assert.match(errors, /state-mutating test must import a declared test-data factory/);
  assert.match(errors, /cleanup_strategy after-each requires test\.afterEach/);
  assert.match(errors, /instantiate ItemsPage through the fixture/);
  assert.match(errors, /browser contexts must be created by a lifecycle fixture/);
  assert.match(errors, /browser locators belong in page or component objects/);
});

test("test narrative and assertion steps follow the selected profile", async () => {
  const manifest = await implementationFixture();
  browserFile(manifest).source = browserFile(manifest).source
    .replace("Given an empty item list", "an empty item list")
    .replace("Should show the item in the list", "checks the item");
  const errors = validatePlaywrightImplementation(manifest).errors.join("\n");
  assert.match(errors, /describe title must start with Given or When/);
  assert.match(errors, /step title does not match given-when-should/);

  const withoutSteps = await implementationFixture();
  browserFile(withoutSteps).source = browserFile(withoutSteps).source.replace(
    /await test\.step\("Should announce[\s\S]*?\n        \}\);/,
    "await expect(itemsPage.status).toHaveText(ItemText.ADDED_STATUS);",
  );
  assert.match(validatePlaywrightImplementation(withoutSteps).errors.join("\n"), /assertion must be inside test\.step/);
});

test("flake-prone patterns remain hard failures", async () => {
  const patterns = [
    ["await page.waitForTimeout(1000);", /fixed waits are prohibited/],
    ["await page.waitForLoadState('networkidle');", /networkidle waits are prohibited/],
    ["const handle = await page.getByRole('list').elementHandle();", /element handles are prohibited/],
    ["expect(await page.getByRole('list').isVisible()).toBe(true);", /sampled state assertions are prohibited/],
    ["test.only('focused', async () => {});", /focused tests are prohibited/],
  ];
  for (const [snippet, expected] of patterns) {
    const manifest = await implementationFixture();
    browserFile(manifest).source += `\n${snippet}\n`;
    assert.match(validatePlaywrightImplementation(manifest).errors.join("\n"), expected);
  }
});

test("structural selectors, positional selectors, and exclusions require findings", async () => {
  const positional = await implementationFixture();
  pageObjectFile(positional).source += `\nexport const firstItem = (page) => page.locator("li").first();\n`;
  let errors = validatePlaywrightImplementation(positional).errors.join("\n");
  assert.match(errors, /structural locator requires a finding/);
  assert.match(errors, /positional locator requires a finding/);
  positional.findings.push({
    id: "finding-001",
    category: "locator",
    target: "pages/items/items.page.ts",
    summary: "Position is the behavior under test",
    source_change_approved: false,
  });
  assert.deepEqual(validatePlaywrightImplementation(refreshVerification(positional)).errors, []);

  const excluded = await implementationFixture();
  browserFile(excluded).source += `\ntest.describe.skip("When the feed is offline", () => {});\n`;
  assert.match(validatePlaywrightImplementation(excluded).errors.join("\n"), /skipped test requires an exclusion finding/);
  excluded.findings.push({
    id: "finding-002",
    category: "exclusion",
    target: "tests/items/e2e/add-item.spec.ts",
    summary: "Blocked on a missing test double",
    source_change_approved: false,
  });
  assert.deepEqual(validatePlaywrightImplementation(refreshVerification(excluded)).errors, []);
});

test("objects contain no assertions and are constructed by fixtures", async () => {
  const assertion = await implementationFixture();
  pageObjectFile(assertion).source += "\nexport async function verify(locator) { await expect(locator).toBeVisible(); }\n";
  assert.match(validatePlaywrightImplementation(assertion).errors.join("\n"), /page-object must not contain assertions/);

  const noRegistration = await implementationFixture();
  noRegistration.files.find((file) => file.path === "fixtures/pom/page-object-fixture.ts").source =
    "import { test as base } from '@playwright/test'; export const test = base;";
  assert.match(validatePlaywrightImplementation(noRegistration).errors.join("\n"), /ItemsPage must be registered in a fixture/);
});

test("central fixture import, one tag, and test_case annotation are mandatory", async () => {
  const directImport = await implementationFixture();
  browserFile(directImport).source = browserFile(directImport).source.replace(
    'from "../../../fixtures/pom/test-options"',
    'from "@playwright/test"',
  );
  assert.match(validatePlaywrightImplementation(directImport).errors.join("\n"), /import test from fixtures\/pom\/test-options\.ts/);

  const missingMetadata = await implementationFixture();
  browserFile(missingMetadata).source = browserFile(missingMetadata).source
    .replace('tag: "@e2e",', "")
    .replace('annotation: { type: "test_case", description: "case-browser" },', "");
  const errors = validatePlaywrightImplementation(missingMetadata).errors.join("\n");
  assert.match(errors, /exactly one tag/);
  assert.match(errors, /test_case annotation/);

  const wrongTrace = await implementationFixture();
  browserFile(wrongTrace).source = browserFile(wrongTrace).source.replace(
    'description: "case-browser"',
    'description: "case-other"',
  );
  assert.match(
    validatePlaywrightImplementation(wrongTrace).errors.join("\n"),
    /test_case case-other is not declared in candidate_ids/,
  );
});

test("state mutation requires a factory and enforceable cleanup", async () => {
  const noFactory = await implementationFixture();
  browserFile(noFactory).source = browserFile(noFactory).source.replace(
    /import \{ generateItemName \}[^\n]+\n/,
    "",
  );
  assert.match(validatePlaywrightImplementation(noFactory).errors.join("\n"), /must import a declared test-data factory/);

  const noCleanup = await implementationFixture();
  browserFile(noCleanup).source = browserFile(noCleanup).source.replace(/\s*test\.afterEach\([^\n]+\);/, "");
  assert.match(validatePlaywrightImplementation(noCleanup).errors.join("\n"), /after-each requires test\.afterEach/);
});

test("file layout and architecture profile are machine-enforced", async () => {
  const wrongSpec = await implementationFixture();
  wrongSpec.files[0].path = "tests/items/create-item.spec.ts";
  assert.match(
    validatePlaywrightImplementation(wrongSpec).errors.join("\n"),
    /spec belongs at tests\/<area>\/<api\|e2e\|functional>\/<name>\.spec\.ts/,
  );

  const wrongPage = await implementationFixture();
  pageObjectFile(wrongPage).path = "tests/pom/items.page.ts";
  assert.match(
    validatePlaywrightImplementation(wrongPage).errors.join("\n"),
    /page-object belongs at pages\/<area>\/<name>\.page\.ts/,
  );

  const native = await implementationFixture();
  native.architecture.profile = "repository-native";
  assert.match(validatePlaywrightImplementation(native).errors.join("\n"), /repository-native requires a rationale/);
  native.architecture.rationale = "The existing repository already has equivalent layered directories.";
  assert.deepEqual(validatePlaywrightImplementation(refreshVerification(native)).errors, []);
});

test("configuration and CI quality gates are explicit and pinned", async () => {
  const manifest = await implementationFixture();
  manifest.configuration.playwright_version = "latest";
  delete manifest.ci_integration.commands.typecheck;
  const errors = validatePlaywrightImplementation(manifest).errors.join("\n");
  assert.match(errors, /exact semantic version required/);
  assert.match(errors, /commands\/typecheck: required/);
});

test("verification count and source checksum cover the whole manifest", async () => {
  const underExecuted = await implementationFixture();
  underExecuted.verification_results.tests = 1;
  underExecuted.verification_results.passed = 3;
  assert.match(validatePlaywrightImplementation(underExecuted).errors.join("\n"), /expected 2 declared tests/);

  const stale = await implementationFixture();
  stale.configuration.locale = "pt-BR";
  assert.match(validatePlaywrightImplementation(stale).errors.join("\n"), /source_checksum: does not match/);
});

test("implementation evidence only finalizes from a raw runner report", async (t) => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-playwright-"));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const store = new RunStore({ workspace, runId: "run-playwright-0001" });
  await store.initialize();
  await assert.rejects(writePlaywrightImplementation(store, await implementationFixture()), /runner report is required/);
  assert.equal((await writePlaywrightImplementation(
    store,
    await implementationFixture(),
    { runnerReport: reporterFixture() },
  )).length, 2);
  const result = await store.finalize({
    skill: "implement-playwright",
    status: "completed",
    requiredArtifacts: PLAYWRIGHT_REQUIRED_ARTIFACTS,
  });
  assert.equal(result.envelope.status, "completed");
});

test("comments cannot impersonate executable tests", async () => {
  const manifest = await implementationFixture();
  browserFile(manifest).source = "// test('fake', () => {});\n// test.step('Should pass', () => {});";
  assert.match(validatePlaywrightImplementation(manifest).errors.join("\n"), /executable test declaration required/);
});

test("locator evidence remains explicit and completion reports inferred evidence", async () => {
  const missing = await implementationFixture();
  delete pageObjectFile(missing).locator_evidence;
  assert.match(validatePlaywrightImplementation(missing).errors.join("\n"), /locator_evidence: expected one of/);

  const inferred = await implementationFixture();
  pageObjectFile(inferred).locator_evidence = "inferred";
  refreshVerification(inferred);
  assert.deepEqual(validatePlaywrightImplementation(inferred).errors, []);
  assert.deepEqual(inferredLocatorFiles(inferred), ["pages/items/items.page.ts"]);
  assert.match(implementationCompletionGaps(inferred).join("\n"), /Locator evidence is inferred/);
});

test("an empty implementation cannot claim completion", () => {
  const errors = validatePlaywrightImplementation({
    candidates: [],
    files: [],
    configuration: {},
    ci_integration: {},
    verification_results: { tests: 0, repetitions: 3, retries: 0, passed: 0, failed: 0, flaky: 0 },
  }).errors.join("\n");
  assert.match(errors, /at least one approved candidate/);
  assert.match(errors, /at least one spec file/);
  assert.match(errors, /tests: expected a positive integer/);
});
