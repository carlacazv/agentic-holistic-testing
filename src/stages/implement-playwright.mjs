import path from "node:path";
import { canonicalJson } from "../core/canonical.mjs";
import { checksum } from "../core/checksum.mjs";
import { markdownTable } from "../core/markdown.mjs";
import {
  callName,
  declaredClassNames,
  exportedBindings,
  importedBindings,
  instantiatedClassNames,
  objectProperty,
  parseTypeScript,
  staticString,
  textPrefix,
  walkAst,
} from "../core/typescript-ast.mjs";

const accessibleLocator = /getBy(?:Role|Label|Placeholder|Text|AltText|Title|TestId)\s*\(/;
const webFirstAssertion = /expect\s*\([\s\S]*?\)\s*\.\s*(?:not\s*\.)?to(?:BeVisible|BeHidden|BeEnabled|BeDisabled|BeChecked|HaveText|ContainText|HaveValue|HaveCount|HaveURL|HaveTitle)\s*\(/;
const fixedWait = /waitForTimeout\s*\(|setTimeout\s*\(/;
const networkIdle = /networkidle/;
const elementHandle = /elementHandle\s*\(/;
const sampledAssertion = /expect\s*\(\s*await\s[^;]*?\.(?:isVisible|isHidden|isEnabled|isDisabled|isChecked|isEditable)\s*\(/;
const positionalLocator = /\.(?:first|last|nth)\s*\(/;
const structuralLocator = /\.locator\s*\(/;
const testIdLocator = /getByTestId\s*\(/;
const testExclusion = /\btest\s*(?:\.\w+)*\.(?:skip|fixme)\s*\(/;
const focusedTest = /\btest\s*(?:\.\w+)*\.only\s*\(/;
const absoluteUrl = /^https?:\/\//i;

const AGENTIC_PATHS = Object.freeze({
  spec: /^tests\/[^/]+\/(?:api|e2e|functional)\/[^/]+\.spec\.ts$/,
  "page-object": /^pages\/[^/]+\/[^/]+\.page\.ts$/,
  "component-object": /^pages\/(?:components|[^/]+\/components)\/[^/]+\.component\.ts$/,
  fixture: /^fixtures\/(?:api|helper|pom)\/[^/]+\.ts$/,
  factory: /^test-data\/factories\/[^/]+\/[^/]+\.factory\.ts$/,
  "static-data": /^test-data\/static\/[^/]+\/[^/]+\.ts$/,
  enum: /^enums\/[^/]+\/[^/]+\.ts$/,
  config: /^(?:playwright\.config|config\/[^/]+)\.ts$/,
});

const NATIVE_SUFFIXES = Object.freeze({
  spec: /\.spec\.ts$/,
  "page-object": /\.page\.ts$/,
  "component-object": /\.component\.ts$/,
  fixture: /\.ts$/,
  factory: /\.factory\.ts$/,
  "static-data": /\.ts$/,
  enum: /\.ts$/,
  config: /\.ts$/,
});

export const FILE_KINDS = Object.freeze([
  "spec",
  "page-object",
  "component-object",
  "fixture",
  "factory",
  "static-data",
  "enum",
  "config",
]);
export const UI_ABSTRACTIONS = Object.freeze(["page-object", "component-object"]);
export const LOCATOR_EVIDENCE = Object.freeze(["live-snapshot", "inferred"]);
export const ARCHITECTURE_PROFILES = Object.freeze(["agentic-playwright", "repository-native"]);
export const TEST_STRUCTURES = Object.freeze(["given-when-should", "given-when-then", "repository-native"]);
export const CLEANUP_STRATEGIES = Object.freeze(["not-required", "after-each", "after-all", "fixture"]);
export const VALID_TEST_TAGS = Object.freeze(["@smoke", "@sanity", "@regression", "@e2e", "@api", "@destructive"]);

const OBJECT_KINDS = Object.freeze(["page-object", "component-object"]);
const CHECKSUM_PATTERN = /^sha256:[a-f0-9]{64}$/;

function executableSource(source) {
  let result = "";
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (character === "\n") { lineComment = false; result += character; }
      continue;
    }
    if (blockComment) {
      if (character === "*" && next === "/") { blockComment = false; index += 1; }
      continue;
    }
    if (quote !== null) {
      result += character;
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (["'", '"', "`"].includes(character)) { quote = character; result += character; continue; }
    if (character === "/" && next === "/") { lineComment = true; index += 1; continue; }
    if (character === "/" && next === "*") { blockComment = true; index += 1; continue; }
    result += character;
  }
  return result;
}

export function implementationSourceChecksum(manifest) {
  const sources = (manifest.files ?? [])
    .map(({ path: filePath, kind = "spec", source = "" }) => ({ path: filePath, kind, source }))
    .sort((left, right) => left.path.localeCompare(right.path));
  return checksum(canonicalJson({
    architecture: manifest.architecture ?? null,
    candidates: manifest.candidates ?? [],
    ci_integration: manifest.ci_integration ?? null,
    configuration: manifest.configuration ?? null,
    files: sources,
  }));
}

function reportTests(report) {
  const collected = [];
  const visit = (suite, titles = []) => {
    const nextTitles = suite.title ? [...titles, suite.title] : titles;
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) collected.push({
        identity: `${spec.file ?? ""}:${[...nextTitles, spec.title, test.projectName ?? ""].join(" > ")}`,
        results: test.results ?? [],
      });
    }
    for (const child of suite.suites ?? []) visit(child, nextTitles);
  };
  for (const suite of report.suites ?? []) visit(suite);
  return collected;
}

export function verificationFromPlaywrightReport(manifest, report, executedCommand) {
  if (!report || typeof report !== "object" || !Array.isArray(report.suites)) throw new TypeError("Playwright JSON report is required");
  if (executedCommand !== manifest.ci_integration?.command) throw new TypeError("Executed command must match the declared CI command");
  const entries = reportTests(report);
  if (entries.length === 0) throw new TypeError("Playwright report contains no collected tests");
  const identities = new Map();
  const statuses = [];
  for (const entry of entries) {
    identities.set(entry.identity, (identities.get(entry.identity) ?? 0) + 1);
    for (const result of entry.results) statuses.push(result.status);
  }
  if (statuses.length === 0) throw new TypeError("Playwright report contains no test results");
  const repetitions = Math.min(...identities.values());
  const tests = identities.size;
  const failedStatuses = new Set(["failed", "timedOut", "interrupted"]);
  return {
    tests,
    repetitions,
    retries: Number(report.config?.retries ?? 0),
    passed: statuses.filter((status) => status === "passed").length,
    failed: statuses.filter((status) => failedStatuses.has(status)).length,
    flaky: 0,
    skipped: statuses.filter((status) => status === "skipped").length,
    executed_command: executedCommand,
    report_checksum: checksum(canonicalJson(report)),
    source_checksum: implementationSourceChecksum(manifest),
    evidence_source: "playwright-json",
  };
}

export function verificationOutcome(manifest) {
  const result = manifest.verification_results ?? {};
  if ((result.failed ?? 0) > 0) return "fail";
  if ((result.flaky ?? 0) > 0 || (result.skipped ?? 0) > 0) return "inconclusive";
  return (result.passed ?? 0) > 0 ? "pass" : "not-run";
}

export function implementationCompletionGaps(manifest) {
  const outcome = verificationOutcome(manifest);
  const gaps = [];
  if (outcome === "inconclusive") gaps.push("Playwright verification contains flaky or skipped outcomes");
  if (outcome === "not-run") gaps.push("Playwright verification did not execute tests");
  gaps.push(...inferredLocatorFiles(manifest).map((file) => `Locator evidence is inferred for ${file}`));
  return gaps;
}

function hasFinding(manifest, category, target) {
  return (manifest.findings ?? []).some((entry) => entry.category === category && entry.target === target);
}

function canonicalModulePath(value) {
  return typeof value === "string"
    ? value.replace(/^\.\//, "").replace(/\.(?:m?[jt]s|tsx)$/, "")
    : null;
}

function resolvedImportPath(filePath, source) {
  if (typeof source !== "string") return null;
  if (!source.startsWith(".")) return canonicalModulePath(source);
  return canonicalModulePath(path.posix.normalize(path.posix.join(path.posix.dirname(filePath), source)));
}

function callsNamed(ast, name) {
  const calls = [];
  walkAst(ast, (node) => {
    if (node.type === "CallExpression" && callName(node.callee) === name) calls.push(node);
  });
  return calls;
}

function containsCall(ast, predicate) {
  let found = false;
  walkAst(ast, (node) => {
    if (!found && node.type === "CallExpression" && predicate(callName(node.callee), node)) found = true;
  });
  return found;
}

function stringValues(node) {
  const single = staticString(node);
  if (single !== null) return [single];
  if (node?.type !== "ArrayExpression") return [];
  return node.elements.map(staticString).filter((value) => value !== null);
}

function annotationsWithType(node, expectedType) {
  const annotations = node?.type === "ArrayExpression" ? node.elements : [node];
  return annotations.filter((annotation) => {
    const type = objectProperty(annotation, "type");
    return staticString(type?.value) === expectedType;
  });
}

function validateTestDetails(file, testCalls, errors) {
  const candidateIds = new Set(Array.isArray(file.candidate_ids) ? file.candidate_ids : []);
  for (const [index, call] of testCalls.entries()) {
    const details = call.arguments[1]?.type === "ObjectExpression" ? call.arguments[1] : null;
    const tags = stringValues(objectProperty(details, "tag")?.value);
    const location = call.loc?.start?.line ? ` at line ${call.loc.start.line}` : ` #${index + 1}`;
    if (tags.length !== 1) {
      errors.push(`/files/${file.path}: each test requires exactly one tag${location}`);
    } else if (!VALID_TEST_TAGS.includes(tags[0])) {
      errors.push(`/files/${file.path}: unsupported test tag ${tags[0]}${location}`);
    }
    const testCaseAnnotations = annotationsWithType(
      objectProperty(details, "annotation")?.value,
      "test_case",
    );
    if (testCaseAnnotations.length !== 1) {
      errors.push(`/files/${file.path}: each test requires exactly one test_case annotation${location}`);
      continue;
    }
    const description = objectProperty(testCaseAnnotations[0], "description")?.value;
    if (!description) {
      errors.push(`/files/${file.path}: test_case annotation requires a description${location}`);
      continue;
    }
    const staticDescription = staticString(description);
    if (staticDescription !== null && !candidateIds.has(staticDescription)) {
      errors.push(`/files/${file.path}: test_case ${staticDescription} is not declared in candidate_ids${location}`);
    }
  }
}

function validateDescribeTags(file, ast, errors) {
  for (const describe of callsNamed(ast, "test.describe")) {
    const title = textPrefix(describe.arguments[0]);
    const details = describe.arguments[1]?.type === "ObjectExpression" ? describe.arguments[1] : null;
    if (objectProperty(details, "tag") || /@[a-z]/i.test(title ?? "")) {
      errors.push(`/files/${file.path}: tags belong on tests, not test.describe`);
    }
  }
}

function validateTestStructure(file, ast, structure, errors) {
  const describes = callsNamed(ast, "test.describe");
  const steps = callsNamed(ast, "test.step");
  if (steps.length === 0) errors.push(`/files/${file.path}: assertions must be wrapped in test.step`);
  if (structure !== "repository-native") {
    for (const describe of describes) {
      const title = textPrefix(describe.arguments[0]);
      if (!/^(?:Given|When) \S/i.test(title ?? "")) {
        errors.push(`/files/${file.path}: describe title must start with Given or When: ${title ?? "<dynamic>"}`);
      }
    }
  }
  const stepPattern = structure === "given-when-should"
    ? /^Should \S/i
    : structure === "given-when-then"
      ? /^(?:Given|When|Then) \S/i
      : null;
  if (stepPattern) {
    for (const step of steps) {
      const title = textPrefix(step.arguments[0]);
      if (!stepPattern.test(title ?? "")) {
        errors.push(`/files/${file.path}: step title does not match ${structure}: ${title ?? "<dynamic>"}`);
      }
    }
  }

  walkAst(ast, (node, ancestors) => {
    if (node.type !== "CallExpression" || callName(node.callee) !== "expect") return;
    const insideStep = ancestors.some(
      (ancestor) => ancestor.type === "CallExpression" && callName(ancestor.callee) === "test.step",
    );
    if (!insideStep) {
      const line = node.loc?.start?.line ? ` at line ${node.loc.start.line}` : "";
      errors.push(`/files/${file.path}: assertion must be inside test.step${line}`);
    }
  });
}

function validateSpecImports(file, ast, architecture, declaredFactories, errors) {
  const imports = importedBindings(ast);
  const expectedFixture = canonicalModulePath(architecture.fixture_import);
  for (const bindingName of ["test", "expect"]) {
    const binding = imports.find(
      (entry) => entry.imported === bindingName && entry.local === bindingName && entry.importKind !== "type",
    );
    const resolved = binding ? resolvedImportPath(file.path, binding.source) : null;
    if (resolved !== expectedFixture) {
      errors.push(`/files/${file.path}: import ${bindingName} from ${architecture.fixture_import}`);
    }
  }
  if (imports.some((entry) => entry.source === "@playwright/test" && entry.importKind !== "type")) {
    errors.push(`/files/${file.path}: runtime Playwright imports belong in the central fixture`);
  }
  if (imports.some((entry) => entry.source?.endsWith(".json"))) {
    errors.push(`/files/${file.path}: static test data must come from TypeScript, not JSON`);
  }
  const factoryImports = imports
    .filter((entry) => entry.importKind !== "type")
    .map((entry) => resolvedImportPath(file.path, entry.source))
    .filter((entry) => entry !== null);
  if (file.mutates_state === true && !factoryImports.some((entry) => declaredFactories.has(entry))) {
    errors.push(`/files/${file.path}: a state-mutating test must import a declared test-data factory`);
  }
}

function validateCleanup(file, ast, declaredFiles, errors) {
  if (typeof file.mutates_state !== "boolean") {
    errors.push(`/files/${file.path}/mutates_state: expected a boolean`);
  }
  if (!CLEANUP_STRATEGIES.includes(file.cleanup_strategy)) {
    errors.push(`/files/${file.path}/cleanup_strategy: expected one of ${CLEANUP_STRATEGIES.join(", ")}`);
    return;
  }
  if (file.mutates_state === false && file.cleanup_strategy !== "not-required") {
    errors.push(`/files/${file.path}: read-only tests must declare cleanup_strategy not-required`);
  }
  if (file.mutates_state === true && file.cleanup_strategy === "not-required") {
    errors.push(`/files/${file.path}: state mutation requires cleanup`);
  }
  if (file.cleanup_strategy === "after-each" && callsNamed(ast, "test.afterEach").length === 0) {
    errors.push(`/files/${file.path}: cleanup_strategy after-each requires test.afterEach`);
  }
  if (file.cleanup_strategy === "after-all" && callsNamed(ast, "test.afterAll").length === 0) {
    errors.push(`/files/${file.path}: cleanup_strategy after-all requires test.afterAll`);
  }
  if (file.cleanup_strategy === "fixture") {
    const cleanupFile = declaredFiles.get(file.cleanup_file);
    if (!cleanupFile || cleanupFile.kind !== "fixture") {
      errors.push(`/files/${file.path}/cleanup_file: fixture cleanup requires a declared fixture file`);
    }
  }
}

function validFilePath(kind, filePath, profile) {
  const pattern = profile === "agentic-playwright" ? AGENTIC_PATHS[kind] : NATIVE_SUFFIXES[kind];
  return Boolean(pattern?.test(filePath));
}

function expectedPath(kind) {
  return {
    spec: "tests/<area>/<api|e2e|functional>/<name>.spec.ts",
    "page-object": "pages/<area>/<name>.page.ts",
    "component-object": "pages/components/<name>.component.ts",
    fixture: "fixtures/<api|helper|pom>/<name>.ts",
    factory: "test-data/factories/<area>/<name>.factory.ts",
    "static-data": "test-data/static/<area>/<name>.ts",
    enum: "enums/<area>/<name>.ts",
    config: "config/<name>.ts or playwright.config.ts",
  }[kind];
}

export function validatePlaywrightImplementation(manifest) {
  const errors = [];
  const architecture = manifest.architecture ?? {};
  if (architecture.standard_version !== 1) {
    errors.push("/architecture/standard_version: expected 1");
  }
  if (!ARCHITECTURE_PROFILES.includes(architecture.profile)) {
    errors.push(`/architecture/profile: expected one of ${ARCHITECTURE_PROFILES.join(", ")}`);
  }
  if (!TEST_STRUCTURES.includes(architecture.test_structure)) {
    errors.push(`/architecture/test_structure: expected one of ${TEST_STRUCTURES.join(", ")}`);
  }
  if (typeof architecture.fixture_import !== "string" || architecture.fixture_import.length === 0) {
    errors.push("/architecture/fixture_import: required");
  }
  if (
    architecture.profile === "repository-native" &&
    (typeof architecture.rationale !== "string" || architecture.rationale.trim().length === 0)
  ) {
    errors.push("/architecture/rationale: repository-native requires a rationale");
  }

  const candidates = new Map();
  for (const [index, candidate] of (manifest.candidates ?? []).entries()) {
    if (candidates.has(candidate.test_case_id)) {
      errors.push(`/candidates/${index}/test_case_id: duplicate ${candidate.test_case_id}`);
    }
    if (
      candidate.approved !== true ||
      candidate.decision !== "automate" ||
      !["api", "browser-e2e"].includes(candidate.recommended_level)
    ) {
      errors.push(`/candidates/${index}: candidate is not approved for Playwright implementation`);
    }
    candidates.set(candidate.test_case_id, candidate);
  }
  if (!Array.isArray(manifest.candidates) || manifest.candidates.length === 0) {
    errors.push("/candidates: at least one approved candidate is required");
  }

  const files = manifest.files ?? [];
  const declaredFiles = new Map();
  const astByPath = new Map();
  for (const [index, file] of files.entries()) {
    if (typeof file.path !== "string") continue;
    if (declaredFiles.has(file.path)) errors.push(`/files/${index}/path: duplicate ${file.path}`);
    declaredFiles.set(file.path, file);
    if (typeof file.source !== "string") continue;
    try {
      astByPath.set(file.path, parseTypeScript(file.source, file.path));
    } catch (error) {
      errors.push(`/files/${file.path}: ${error.message}`);
    }
  }

  const specFiles = files.filter((file) => (file.kind ?? "spec") === "spec");
  if (specFiles.length === 0) errors.push("/files: at least one spec file is required");
  const objectFiles = files.filter((file) => OBJECT_KINDS.includes(file.kind));
  const declaredObjectKinds = new Set(objectFiles.map((file) => file.kind));
  const declaredFactories = new Set(
    files.filter((file) => file.kind === "factory").map((file) => canonicalModulePath(file.path)),
  );
  const objectClassFiles = new Map();
  for (const file of objectFiles) {
    const ast = astByPath.get(file.path);
    if (!ast) continue;
    const classes = declaredClassNames(ast);
    if (classes.size === 0) errors.push(`/files/${file.path}: an object file must declare a class`);
    for (const className of classes) objectClassFiles.set(className, file.path);
  }
  const instantiatedObjects = new Set();
  for (const file of files.filter((entry) => entry.kind === "fixture")) {
    const ast = astByPath.get(file.path);
    if (!ast) continue;
    for (const className of instantiatedClassNames(ast)) instantiatedObjects.add(className);
  }

  const covered = new Set();
  for (const [index, file] of files.entries()) {
    if (file.kind === undefined) errors.push(`/files/${index}/kind: required`);
    const kind = file.kind ?? "spec";
    if (!FILE_KINDS.includes(kind)) {
      errors.push(`/files/${index}/kind: unknown file kind ${file.kind}`);
    }
    if (typeof file.path !== "string" || !file.path.endsWith(".ts")) {
      errors.push(`/files/${index}/path: expected a TypeScript file`);
    } else if (FILE_KINDS.includes(kind) && !validFilePath(kind, file.path, architecture.profile)) {
      errors.push(`/files/${file.path}: ${kind} belongs at ${expectedPath(kind)}`);
    }
    if (typeof file.source !== "string") {
      errors.push(`/files/${index}/source: required`);
      continue;
    }
    const ast = astByPath.get(file.path);
    if (!ast) continue;
    const activeSource = executableSource(file.source);
    if (
      (accessibleLocator.test(file.source) || structuralLocator.test(file.source)) &&
      !LOCATOR_EVIDENCE.includes(file.locator_evidence)
    ) {
      errors.push(`/files/${file.path}/locator_evidence: expected one of ${LOCATOR_EVIDENCE.join(", ")}`);
    }

    if (fixedWait.test(activeSource)) errors.push(`/files/${file.path}: fixed waits are prohibited`);
    if (networkIdle.test(activeSource)) {
      errors.push(`/files/${file.path}: networkidle waits are prohibited; wait for the specific element or response`);
    }
    if (elementHandle.test(activeSource)) {
      errors.push(`/files/${file.path}: element handles are prohibited; use locators that re-query`);
    }
    if (sampledAssertion.test(activeSource)) {
      errors.push(`/files/${file.path}: sampled state assertions are prohibited; use a retrying web-first assertion`);
    }
    if (positionalLocator.test(activeSource) && !hasFinding(manifest, "locator", file.path)) {
      errors.push(`/files/${file.path}: positional locator requires a finding`);
    }
    if (structuralLocator.test(activeSource) && !hasFinding(manifest, "locator", file.path)) {
      errors.push(`/files/${file.path}: structural locator requires a finding`);
    }
    if (testIdLocator.test(activeSource) && !hasFinding(manifest, "locator", file.path)) {
      errors.push(`/files/${file.path}: test-id locator requires a finding`);
    }
    if (testExclusion.test(activeSource) && !hasFinding(manifest, "exclusion", file.path)) {
      errors.push(`/files/${file.path}: skipped test requires an exclusion finding`);
    }
    if (focusedTest.test(activeSource)) {
      errors.push(`/files/${file.path}: focused tests are prohibited; a focused run drops every other test`);
    }

    let containsAny = false;
    let containsAbsoluteUrl = false;
    walkAst(ast, (node) => {
      if (node.type === "TSAnyKeyword") containsAny = true;
      if (
        ["Literal", "TemplateLiteral"].includes(node.type) &&
        absoluteUrl.test(staticString(node) ?? "")
      ) {
        containsAbsoluteUrl = true;
      }
    });
    if (containsAny) errors.push(`/files/${file.path}: TypeScript any is prohibited`);
    if (containsAbsoluteUrl && kind !== "config") {
      errors.push(`/files/${file.path}: absolute URLs belong in config`);
    }

    if (OBJECT_KINDS.includes(kind)) {
      if (callsNamed(ast, "expect").length > 0) {
        errors.push(`/files/${file.path}: a ${kind} must not contain assertions`);
      }
      if (callsNamed(ast, "test").length > 0) {
        errors.push(`/files/${file.path}: a ${kind} must not declare tests`);
      }
      continue;
    }

    if (kind !== "spec") continue;

    const testCalls = callsNamed(ast, "test");
    if (testCalls.length === 0) errors.push(`/files/${file.path}: executable test declaration required`);
    if (!Number.isInteger(file.expected_tests) || file.expected_tests < 1) {
      errors.push(`/files/${file.path}/expected_tests: expected a positive integer`);
    } else if (file.expected_tests < testCalls.length) {
      errors.push(`/files/${file.path}/expected_tests: fewer than declared test calls`);
    }
    validateTestDetails(file, testCalls, errors);
    validateDescribeTags(file, ast, errors);
    validateTestStructure(file, ast, architecture.test_structure, errors);
    validateSpecImports(file, ast, architecture, declaredFactories, errors);
    validateCleanup(file, ast, declaredFiles, errors);
    if (
      file.mutates_state === false &&
      containsCall(ast, (name) => /\brequest\.(?:post|put|patch|delete)$/.test(name ?? ""))
    ) {
      errors.push(`/files/${file.path}: mutating request requires mutates_state true`);
    }

    for (const className of instantiatedClassNames(ast)) {
      if (objectClassFiles.has(className)) {
        errors.push(`/files/${file.path}: instantiate ${className} through the fixture, not in a spec`);
      }
    }
    if (containsCall(ast, (name) => name?.endsWith(".newContext"))) {
      errors.push(`/files/${file.path}: browser contexts must be created by a lifecycle fixture`);
    }

    const fileCandidateIds = Array.isArray(file.candidate_ids) ? file.candidate_ids : [];
    if (!Array.isArray(file.candidate_ids) || file.candidate_ids.length === 0) {
      errors.push(`/files/${file.path}/candidate_ids: at least one candidate is required`);
    }
    const fileCandidates = fileCandidateIds.map((candidateId) => {
      const candidate = candidates.get(candidateId);
      if (!candidate) errors.push(`/files/${file.path}: unknown candidate ${candidateId}`);
      else covered.add(candidateId);
      return candidate;
    });
    const coversBrowser = fileCandidates.some((candidate) => candidate?.recommended_level === "browser-e2e");
    const coversApi = fileCandidates.some((candidate) => candidate?.recommended_level === "api");

    if (coversBrowser) {
      const abstractionPaths = Array.isArray(file.ui_abstraction_paths) ? file.ui_abstraction_paths : [];
      const abstractionFiles = abstractionPaths.map((filePath) => declaredFiles.get(filePath)).filter(Boolean);
      const reachable = abstractionFiles.map((entry) => entry.source ?? "").join("\n");
      if (!accessibleLocator.test(reachable)) errors.push(`/files/${file.path}: accessible locator required`);
      if (!webFirstAssertion.test(activeSource)) errors.push(`/files/${file.path}: web-first assertion required`);
      if (containsCall(ast, (name) => /\.(?:locator|frameLocator|getByRole|getByLabel|getByPlaceholder|getByText|getByAltText|getByTitle|getByTestId)$/.test(name ?? ""))) {
        errors.push(`/files/${file.path}: browser locators belong in page or component objects`);
      }

      if (!UI_ABSTRACTIONS.includes(file.ui_abstraction)) {
        errors.push(`/files/${file.path}/ui_abstraction: expected one of ${UI_ABSTRACTIONS.join(", ")}`);
      } else if (!declaredObjectKinds.has(file.ui_abstraction)) {
        errors.push(`/files/${file.path}/ui_abstraction: declares ${file.ui_abstraction} but no such file is provided`);
      }
      if (abstractionPaths.length === 0) {
        errors.push(`/files/${file.path}/ui_abstraction_paths: at least one object path is required`);
      }
      for (const abstractionPath of abstractionPaths) {
        const abstraction = declaredFiles.get(abstractionPath);
        if (!abstraction || !OBJECT_KINDS.includes(abstraction.kind)) {
          errors.push(`/files/${file.path}/ui_abstraction_paths: missing object ${abstractionPath}`);
        } else if (abstraction.kind !== file.ui_abstraction) {
          errors.push(`/files/${file.path}/ui_abstraction_paths: ${abstractionPath} is not a ${file.ui_abstraction}`);
        }
      }
    }

    if (coversApi && !/\brequest\s*\./.test(activeSource)) {
      errors.push(`/files/${file.path}: API candidate requires Playwright request context`);
    }
  }
  for (const candidateId of candidates.keys()) if (!covered.has(candidateId)) errors.push(`/files: missing candidate ${candidateId}`);

  for (const [className, objectPath] of objectClassFiles.entries()) {
    if (!instantiatedObjects.has(className)) {
      errors.push(`/files/${objectPath}: ${className} must be registered in a fixture`);
    }
  }

  const centralFixture = declaredFiles.get(architecture.fixture_import);
  if (!centralFixture || centralFixture.kind !== "fixture") {
    errors.push("/architecture/fixture_import: must reference a declared fixture file");
  } else {
    const fixtureAst = astByPath.get(centralFixture.path);
    if (architecture.profile === "agentic-playwright" && fixtureAst && callsNamed(fixtureAst, "mergeTests").length === 0) {
      errors.push(`/files/${centralFixture.path}: central fixture must merge fixture layers with mergeTests`);
    }
    const fixtureExports = fixtureAst ? exportedBindings(fixtureAst) : new Set();
    if (!fixtureExports.has("test") || !fixtureExports.has("expect")) {
      errors.push(`/files/${centralFixture.path}: central fixture must export test and expect`);
    }
  }

  const hasBrowserCandidate = [...candidates.values()].some((candidate) => candidate.recommended_level === "browser-e2e");
  if (hasBrowserCandidate && !files.some((file) => file.kind === "config" && file.path === "playwright.config.ts")) {
    errors.push("/files: browser implementation requires playwright.config.ts");
  }
  if (hasBrowserCandidate && !files.some((file) => file.kind === "fixture")) {
    errors.push("/files: browser implementation requires a fixture layer");
  }

  const reporters = new Set(manifest.configuration?.reporters ?? []);
  for (const reporter of ["html", "json", "junit"]) if (!reporters.has(reporter)) errors.push(`/configuration/reporters: missing ${reporter}`);
  for (const artifact of ["trace", "screenshot", "video"]) {
    if (!manifest.configuration?.artifacts?.includes(artifact)) errors.push(`/configuration/artifacts: missing ${artifact}`);
  }
  for (const gate of ["lint", "typecheck", "playwright"]) {
    if (!manifest.configuration?.quality_gates?.includes(gate)) {
      errors.push(`/configuration/quality_gates: missing ${gate}`);
    }
  }
  if (typeof manifest.configuration?.locale !== "string" || manifest.configuration.locale.length === 0) {
    errors.push("/configuration/locale: required");
  }
  if (typeof manifest.configuration?.timezone !== "string" || manifest.configuration.timezone.length === 0) {
    errors.push("/configuration/timezone: required");
  }
  if (!/^\d+\.\d+\.\d+$/.test(manifest.configuration?.playwright_version ?? "")) {
    errors.push("/configuration/playwright_version: exact semantic version required");
  }
  if (typeof manifest.ci_integration?.command !== "string" || manifest.ci_integration.command.length === 0) {
    errors.push("/ci_integration/command: required");
  }
  for (const command of ["lint", "typecheck", "playwright"]) {
    if (typeof manifest.ci_integration?.commands?.[command] !== "string" || manifest.ci_integration.commands[command].length === 0) {
      errors.push(`/ci_integration/commands/${command}: required`);
    }
  }
  if (manifest.ci_integration?.commands?.playwright !== manifest.ci_integration?.command) {
    errors.push("/ci_integration/commands/playwright: must match command");
  }
  const verification = manifest.verification_results ?? {};
  if (!Number.isInteger(verification.repetitions) || verification.repetitions < 3) errors.push("/verification_results/repetitions: expected at least 3");
  if (verification.retries !== 0) errors.push("/verification_results/retries: expected 0");
  const expectedTests = specFiles.reduce(
    (total, file) => total + (Number.isInteger(file.expected_tests) ? file.expected_tests : 0),
    0,
  );
  if (!Number.isInteger(verification.tests) || verification.tests < 1) {
    errors.push("/verification_results/tests: expected a positive integer");
  } else if (verification.tests !== expectedTests) {
    errors.push(`/verification_results/tests: expected ${expectedTests} declared tests`);
  }
  for (const name of ["passed", "failed", "flaky", "skipped"]) {
    if (verification[name] !== undefined && (!Number.isInteger(verification[name]) || verification[name] < 0)) {
      errors.push(`/verification_results/${name}: expected a non-negative integer`);
    }
  }
  const observed = (verification.passed ?? 0) + (verification.failed ?? 0) + (verification.skipped ?? 0);
  if (observed !== verification.tests * verification.repetitions) errors.push("/verification_results: outcome totals are inconsistent");
  if (verification.executed_command !== manifest.ci_integration?.command) {
    errors.push("/verification_results/executed_command: must match the declared CI command");
  }
  if (!CHECKSUM_PATTERN.test(verification.report_checksum ?? "")) {
    errors.push("/verification_results/report_checksum: verified runner evidence is required");
  }
  if (verification.evidence_source !== "playwright-json") {
    errors.push("/verification_results/evidence_source: expected playwright-json import");
  }
  if (verification.source_checksum !== implementationSourceChecksum(manifest)) {
    errors.push("/verification_results/source_checksum: does not match the implementation sources");
  }
  return { valid: errors.length === 0, errors };
}

export function inferredLocatorFiles(manifest) {
  return (manifest.files ?? [])
    .filter((file) => file.locator_evidence === "inferred")
    .map((file) => file.path);
}

export const PLAYWRIGHT_REQUIRED_ARTIFACTS = Object.freeze([
  "implement-playwright/implementation.json",
  "implement-playwright/summary.md",
]);

export function playwrightImplementationMarkdown(manifest) {
  return ["# Playwright Implementation", "", "## Files", "", markdownTable(
    ["Path", "Kind", "Candidates", "Locator evidence", "UI abstraction"],
    manifest.files.map((file) => [file.path, file.kind ?? "spec", (file.candidate_ids ?? []).join(", "), file.locator_evidence, file.ui_abstraction]),
  ), "## Verification", "", markdownTable(["Field", "Value"], Object.entries(manifest.verification_results ?? {})),
  "## Findings", "", markdownTable(["ID", "Category", "Target", "Summary"], (manifest.findings ?? []).map((item) => [item.id, item.category, item.target, item.summary])),
  "## Gaps", "", ...(implementationCompletionGaps(manifest).length ? implementationCompletionGaps(manifest).map((gap) => `- ${gap}`) : ["None."]), ""].join("\n");
}

export async function writePlaywrightImplementation(store, manifest, { runnerReport, executedCommand } = {}) {
  if (!runnerReport) throw new TypeError("Playwright JSON runner report is required to write implementation evidence");
  const verifiedManifest = structuredClone(manifest);
  verifiedManifest.verification_results = verificationFromPlaywrightReport(
    verifiedManifest,
    runnerReport,
    executedCommand ?? verifiedManifest.ci_integration?.command,
  );
  const validation = validatePlaywrightImplementation(verifiedManifest);
  if (!validation.valid) throw new TypeError(validation.errors.join("; "));
  return Promise.all([
    store.writeArtifact(
      "implement-playwright/implementation.json",
      `${canonicalJson(verifiedManifest)}\n`,
      { type: "implement-playwright.document", mediaType: "application/json" },
    ),
    store.writeArtifact(
      "implement-playwright/summary.md",
      playwrightImplementationMarkdown(verifiedManifest),
      { type: "implement-playwright.summary", mediaType: "text/markdown" },
    ),
  ]);
}
