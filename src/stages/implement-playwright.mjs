import { canonicalJson } from "../core/canonical.mjs";
import { serializeCsv } from "../core/csv.mjs";
import { checksum } from "../core/checksum.mjs";

const accessibleLocator = /getBy(?:Role|Label|Placeholder|Text|AltText|Title|TestId)\s*\(/;
const webFirstAssertion = /expect\s*\([\s\S]*?\)\s*\.\s*(?:not\s*\.)?to(?:BeVisible|BeHidden|BeEnabled|BeDisabled|BeChecked|HaveText|ContainText|HaveValue|HaveCount|HaveURL|HaveTitle)\s*\(/;
const fixedWait = /waitForTimeout\s*\(|setTimeout\s*\(/;
const networkIdle = /networkidle/;
const elementHandle = /elementHandle\s*\(/;
const sampledAssertion = /expect\s*\(\s*await\s[^;]*?\.(?:isVisible|isHidden|isEnabled|isDisabled|isChecked|isEditable)\s*\(/;
const positionalLocator = /\.(?:first|last|nth)\s*\(/;
const structuralLocator = /\.locator\s*\(/;
const testExclusion = /\btest\s*(?:\.\w+)*\.(?:skip|fixme)\s*\(/;
const focusedTest = /\btest\s*(?:\.\w+)*\.only\s*\(/;
const describeTitles = /test\.describe\s*\(\s*(['"`])([^'"`]*)\1/g;
const stepTitles = /test\.step\s*\(\s*(['"`])([^'"`]*)\1/g;

const specPath = /^tests\/(?!pom\/)[^/]+\/[^/]+\.spec\.ts$/;
const pageObjectPath = /^tests\/pom\/[^/]+\.page\.ts$/;
const componentObjectPath = /^tests\/pom\/[^/]+\.component\.ts$/;

export const FILE_KINDS = Object.freeze(["spec", "page-object", "component-object"]);
export const UI_ABSTRACTIONS = Object.freeze(["page-object", "component-object"]);
export const LOCATOR_EVIDENCE = Object.freeze(["live-snapshot", "inferred"]);

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
  return checksum(canonicalJson(sources));
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
  if (outcome === "inconclusive") return ["Playwright verification contains flaky or skipped outcomes"];
  if (outcome === "not-run") return ["Playwright verification did not execute tests"];
  return [];
}

function titlesOf(source, pattern) {
  return [...source.matchAll(pattern)].map((match) => match[2]);
}

function hasFinding(manifest, category, target) {
  return (manifest.findings ?? []).some((entry) => entry.category === category && entry.target === target);
}

export function validatePlaywrightImplementation(manifest) {
  const errors = [];
  const candidates = new Map();
  for (const [index, candidate] of (manifest.candidates ?? []).entries()) {
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
  const specFiles = files.filter((file) => (file.kind ?? "spec") === "spec");
  if (specFiles.length === 0) errors.push("/files: at least one spec file is required");
  const objectFiles = files.filter((file) => OBJECT_KINDS.includes(file.kind));
  const declaredObjectKinds = new Set(objectFiles.map((file) => file.kind));
  const objectSource = objectFiles.map((file) => file.source ?? "").join("\n");

  const covered = new Set();
  for (const [index, file] of files.entries()) {
    const kind = file.kind ?? "spec";
    if (!FILE_KINDS.includes(kind)) {
      errors.push(`/files/${index}/kind: unknown file kind ${file.kind}`);
    }
    if (typeof file.path !== "string" || !file.path.endsWith(".ts")) {
      errors.push(`/files/${index}/path: expected a TypeScript file`);
    } else if (kind === "spec" && !specPath.test(file.path)) {
      errors.push(`/files/${file.path}: a spec belongs at tests/<feature>/<name>.spec.ts`);
    } else if (kind === "page-object" && !pageObjectPath.test(file.path)) {
      errors.push(`/files/${file.path}: a page-object belongs at tests/pom/<name>.page.ts`);
    } else if (kind === "component-object" && !componentObjectPath.test(file.path)) {
      errors.push(`/files/${file.path}: a component-object belongs at tests/pom/<name>.component.ts`);
    }
    if (typeof file.source !== "string") {
      errors.push(`/files/${index}/source: required`);
      continue;
    }
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
    if (testExclusion.test(activeSource) && !hasFinding(manifest, "exclusion", file.path)) {
      errors.push(`/files/${file.path}: skipped test requires an exclusion finding`);
    }
    if (focusedTest.test(activeSource)) {
      errors.push(`/files/${file.path}: focused tests are prohibited; a focused run drops every other test`);
    }

    if (OBJECT_KINDS.includes(kind)) {
      if (/\bexpect\s*\(/.test(activeSource)) {
        errors.push(`/files/${file.path}: a ${kind} must not contain assertions`);
      }
      if (/\btest\s*(?:\.\w+)?\s*\(/.test(activeSource)) {
        errors.push(`/files/${file.path}: a ${kind} must not declare tests`);
      }
      continue;
    }

    if (!/\btest\s*\(/.test(activeSource)) errors.push(`/files/${file.path}: executable test declaration required`);
    for (const title of titlesOf(activeSource, describeTitles)) {
      if (!/^(?:Given|When) \S/.test(title)) {
        errors.push(`/files/${file.path}: describe title must start with "Given " or "When ": ${title}`);
      }
    }
    const steps = titlesOf(activeSource, stepTitles);
    if (steps.length === 0) errors.push(`/files/${file.path}: assertions must be wrapped in test.step`);
    for (const title of steps) {
      if (!/^Should \S/.test(title)) {
        errors.push(`/files/${file.path}: step title must start with "Should ": ${title}`);
      }
    }

    const fileCandidates = (file.candidate_ids ?? []).map((candidateId) => {
      const candidate = candidates.get(candidateId);
      if (!candidate) errors.push(`/files/${file.path}: unknown candidate ${candidateId}`);
      else covered.add(candidateId);
      return candidate;
    });
    const coversBrowser = fileCandidates.some((candidate) => candidate?.recommended_level === "browser-e2e");
    const coversApi = fileCandidates.some((candidate) => candidate?.recommended_level === "api");

    if (coversBrowser) {
      const reachable = `${activeSource}\n${objectSource}`;
      if (!accessibleLocator.test(reachable)) errors.push(`/files/${file.path}: accessible locator required`);
      if (!webFirstAssertion.test(activeSource)) errors.push(`/files/${file.path}: web-first assertion required`);
      if (structuralLocator.test(reachable) && !hasFinding(manifest, "locator", file.path)) {
        errors.push(`/files/${file.path}: structural locator requires a finding`);
      }

      if (!UI_ABSTRACTIONS.includes(file.ui_abstraction)) {
        errors.push(`/files/${file.path}/ui_abstraction: expected one of ${UI_ABSTRACTIONS.join(", ")}`);
      } else if (!declaredObjectKinds.has(file.ui_abstraction)) {
        errors.push(`/files/${file.path}/ui_abstraction: declares ${file.ui_abstraction} but no such file is provided`);
      }
    }

    if (coversApi && !/\brequest\s*\./.test(activeSource)) {
      errors.push(`/files/${file.path}: API candidate requires Playwright request context`);
    }
  }
  for (const candidateId of candidates.keys()) if (!covered.has(candidateId)) errors.push(`/files: missing candidate ${candidateId}`);

  const reporters = new Set(manifest.configuration?.reporters ?? []);
  for (const reporter of ["html", "json", "junit"]) if (!reporters.has(reporter)) errors.push(`/configuration/reporters: missing ${reporter}`);
  for (const artifact of ["trace", "screenshot", "video"]) {
    if (!manifest.configuration?.artifacts?.includes(artifact)) errors.push(`/configuration/artifacts: missing ${artifact}`);
  }
  if (typeof manifest.ci_integration?.command !== "string" || manifest.ci_integration.command.length === 0) {
    errors.push("/ci_integration/command: required");
  }
  const verification = manifest.verification_results ?? {};
  if (!Number.isInteger(verification.repetitions) || verification.repetitions < 3) errors.push("/verification_results/repetitions: expected at least 3");
  if (verification.retries !== 0) errors.push("/verification_results/retries: expected 0");
  if (!Number.isInteger(verification.tests) || verification.tests < 1) {
    errors.push("/verification_results/tests: expected a positive integer");
  } else if (verification.tests < specFiles.length) {
    errors.push("/verification_results/tests: fewer executed tests than declared spec files");
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
  "implement-playwright/implementation-manifest.json",
  "implement-playwright/testability-findings.csv",
  "implement-playwright/verification-results.json",
]);

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
      "implement-playwright/implementation-manifest.json",
      `${canonicalJson(verifiedManifest)}\n`,
      { type: "implement-playwright.manifest", mediaType: "application/json" },
    ),
    store.writeArtifact(
      "implement-playwright/testability-findings.csv",
      serializeCsv(["id", "category", "target", "summary", "source_change_approved"], verifiedManifest.findings ?? []),
      { type: "implement-playwright.findings", mediaType: "text/csv" },
    ),
    store.writeArtifact(
      "implement-playwright/verification-results.json",
      `${canonicalJson(verifiedManifest.verification_results)}\n`,
      { type: "implement-playwright.verification", mediaType: "application/json" },
    ),
  ]);
}
