import { canonicalJson } from "../core/canonical.mjs";
import { serializeCsv } from "../core/csv.mjs";

const accessibleLocator = /getBy(?:Role|Label|Placeholder|Text|AltText|Title|TestId)\s*\(/;
const webFirstAssertion = /expect\s*\([\s\S]*?\)\s*\.\s*(?:not\s*\.)?to(?:BeVisible|BeHidden|BeEnabled|BeDisabled|BeChecked|HaveText|ContainText|HaveValue|HaveCount|HaveURL|HaveTitle)\s*\(/;
const fixedWait = /waitForTimeout\s*\(|setTimeout\s*\(/;
const networkIdle = /networkidle/;
const elementHandle = /elementHandle\s*\(/;
const sampledAssertion = /expect\s*\(\s*await\s[^;]*?\.(?:isVisible|isHidden|isEnabled|isDisabled|isChecked|isEditable)\s*\(/;
const positionalLocator = /\.(?:first|last|nth)\s*\(/;
const structuralLocator = /\.locator\s*\(/;
const testExclusion = /test\.(?:skip|fixme)\s*\(/;
const describeTitles = /test\.describe\s*\(\s*(['"`])([^'"`]*)\1/g;
const stepTitles = /test\.step\s*\(\s*(['"`])([^'"`]*)\1/g;

export const FILE_KINDS = Object.freeze(["spec", "page-object", "component-object"]);
export const UI_ABSTRACTIONS = Object.freeze(["page-object", "component-object", "inline"]);

const OBJECT_KINDS = Object.freeze(["page-object", "component-object"]);

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
  const browserCandidates = [...candidates.values()].filter(
    (candidate) => candidate.recommended_level === "browser-e2e",
  );

  const files = manifest.files ?? [];
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
    } else if (kind === "spec" && !file.path.endsWith(".spec.ts")) {
      errors.push(`/files/${index}/path: expected TypeScript .spec.ts file`);
    } else if (OBJECT_KINDS.includes(kind) && file.path.endsWith(".spec.ts")) {
      errors.push(`/files/${file.path}: a ${kind} must not be a .spec.ts file`);
    }
    if (typeof file.source !== "string") {
      errors.push(`/files/${index}/source: required`);
      continue;
    }

    if (fixedWait.test(file.source)) errors.push(`/files/${file.path}: fixed waits are prohibited`);
    if (networkIdle.test(file.source)) {
      errors.push(`/files/${file.path}: networkidle waits are prohibited; wait for the specific element or response`);
    }
    if (elementHandle.test(file.source)) {
      errors.push(`/files/${file.path}: element handles are prohibited; use locators that re-query`);
    }
    if (sampledAssertion.test(file.source)) {
      errors.push(`/files/${file.path}: sampled state assertions are prohibited; use a retrying web-first assertion`);
    }
    if (positionalLocator.test(file.source) && !hasFinding(manifest, "locator", file.path)) {
      errors.push(`/files/${file.path}: positional locator requires a finding`);
    }
    if (testExclusion.test(file.source) && !hasFinding(manifest, "exclusion", file.path)) {
      errors.push(`/files/${file.path}: skipped test requires an exclusion finding`);
    }

    if (OBJECT_KINDS.includes(kind)) {
      if (/\bexpect\s*\(/.test(file.source)) {
        errors.push(`/files/${file.path}: a ${kind} must not contain assertions`);
      }
      if (/\btest\s*(?:\.\w+)?\s*\(/.test(file.source)) {
        errors.push(`/files/${file.path}: a ${kind} must not declare tests`);
      }
      continue;
    }

    for (const title of titlesOf(file.source, describeTitles)) {
      if (!/^(?:Given|When) \S/.test(title)) {
        errors.push(`/files/${file.path}: describe title must start with "Given " or "When ": ${title}`);
      }
    }
    const steps = titlesOf(file.source, stepTitles);
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
      const reachable = `${file.source}\n${objectSource}`;
      if (!accessibleLocator.test(reachable)) errors.push(`/files/${file.path}: accessible locator required`);
      if (!webFirstAssertion.test(file.source)) errors.push(`/files/${file.path}: web-first assertion required`);
      if (structuralLocator.test(reachable) && !hasFinding(manifest, "locator", file.path)) {
        errors.push(`/files/${file.path}: structural locator requires a finding`);
      }

      if (!UI_ABSTRACTIONS.includes(file.ui_abstraction)) {
        errors.push(`/files/${file.path}/ui_abstraction: expected one of ${UI_ABSTRACTIONS.join(", ")}`);
      } else if (file.ui_abstraction === "inline") {
        if (browserCandidates.length > 1) {
          errors.push(`/files/${file.path}/ui_abstraction: more than one browser candidate requires a page or component object`);
        }
        if (typeof file.ui_abstraction_rationale !== "string" || file.ui_abstraction_rationale.length === 0) {
          errors.push(`/files/${file.path}/ui_abstraction_rationale: inline abstraction requires a rationale`);
        }
      } else if (!declaredObjectKinds.has(file.ui_abstraction)) {
        errors.push(`/files/${file.path}/ui_abstraction: declares ${file.ui_abstraction} but no such file is provided`);
      }
    }

    if (coversApi && !/\brequest\s*\./.test(file.source)) {
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
  if (verification.failed !== 0 || verification.flaky !== 0) errors.push("/verification_results: failures or flaky outcomes are not accepted");
  if (verification.passed !== verification.tests * verification.repetitions) errors.push("/verification_results/passed: inconsistent total");
  return { valid: errors.length === 0, errors };
}

export const PLAYWRIGHT_REQUIRED_ARTIFACTS = Object.freeze([
  "implement-playwright/implementation-manifest.json",
  "implement-playwright/testability-findings.csv",
  "implement-playwright/verification-results.json",
]);

export async function writePlaywrightImplementation(store, manifest) {
  const validation = validatePlaywrightImplementation(manifest);
  if (!validation.valid) throw new TypeError(validation.errors.join("; "));
  return Promise.all([
    store.writeArtifact(
      "implement-playwright/implementation-manifest.json",
      `${canonicalJson(manifest)}\n`,
      { type: "implement-playwright.manifest", mediaType: "application/json" },
    ),
    store.writeArtifact(
      "implement-playwright/testability-findings.csv",
      serializeCsv(["id", "category", "target", "summary", "source_change_approved"], manifest.findings ?? []),
      { type: "implement-playwright.findings", mediaType: "text/csv" },
    ),
    store.writeArtifact(
      "implement-playwright/verification-results.json",
      `${canonicalJson(manifest.verification_results)}\n`,
      { type: "implement-playwright.verification", mediaType: "application/json" },
    ),
  ]);
}
