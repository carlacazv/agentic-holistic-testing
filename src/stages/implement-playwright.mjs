import { canonicalJson } from "../core/canonical.mjs";
import { serializeCsv } from "../core/csv.mjs";

const accessibleLocator = /getBy(?:Role|Label|Placeholder|Text|AltText|Title|TestId)\s*\(/;
const webFirstAssertion = /expect\s*\([\s\S]*?\)\s*\.\s*(?:not\s*\.)?to(?:BeVisible|BeHidden|BeEnabled|BeDisabled|BeChecked|HaveText|ContainText|HaveValue|HaveCount|HaveURL|HaveTitle)\s*\(/;

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
  const covered = new Set();
  for (const [index, file] of (manifest.files ?? []).entries()) {
    if (typeof file.path !== "string" || !file.path.endsWith(".spec.ts")) {
      errors.push(`/files/${index}/path: expected TypeScript .spec.ts file`);
    }
    if (typeof file.source !== "string") {
      errors.push(`/files/${index}/source: required`);
      continue;
    }
    if (/waitForTimeout\s*\(|setTimeout\s*\(/.test(file.source)) {
      errors.push(`/files/${file.path}: fixed waits are prohibited`);
    }
    for (const candidateId of file.candidate_ids ?? []) {
      const candidate = candidates.get(candidateId);
      if (!candidate) errors.push(`/files/${file.path}: unknown candidate ${candidateId}`);
      else covered.add(candidateId);
      if (candidate?.recommended_level === "browser-e2e") {
        if (!accessibleLocator.test(file.source)) errors.push(`/files/${file.path}: accessible locator required`);
        if (!webFirstAssertion.test(file.source)) errors.push(`/files/${file.path}: web-first assertion required`);
        if (/\.locator\s*\(/.test(file.source)) {
          const finding = (manifest.findings ?? []).some(
            (entry) => entry.category === "locator" && entry.target === file.path,
          );
          if (!finding) errors.push(`/files/${file.path}: structural locator requires a finding`);
        }
      }
      if (candidate?.recommended_level === "api" && !/\brequest\s*\./.test(file.source)) {
        errors.push(`/files/${file.path}: API candidate requires Playwright request context`);
      }
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
