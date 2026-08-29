import { canonicalJson } from "../core/canonical.mjs";
import { checksum } from "../core/checksum.mjs";
import { serializeCsv } from "../core/csv.mjs";
import { planMetrics, validatePlanBundle } from "./plan.mjs";

const PLAN_COLLECTIONS = Object.freeze([
  "requirements",
  "risks",
  "test_cases",
  "test_steps",
  "requirement_test_links",
  "risk_test_links",
]);

const REMOVAL_OPERATIONS = Object.freeze(["remove", "merge"]);

function structuralErrors(bundle, side) {
  if (bundle === null || typeof bundle !== "object" || Array.isArray(bundle)) {
    return [`/${side}: expected a plan bundle object`];
  }
  return PLAN_COLLECTIONS
    .filter((collection) => bundle[collection] !== undefined && !Array.isArray(bundle[collection]))
    .map((collection) => `/${side}/${collection}: expected array`);
}

function identified(records) {
  return (records ?? []).filter((record) => record !== null && typeof record === "object" && typeof record.id === "string");
}

function removalsWithoutModification(beforeRecords, afterIds, modifications, collection, retained = () => true) {
  const errors = [];
  for (const record of identified(beforeRecords)) {
    if (afterIds.has(record.id) || !retained(record)) continue;
    const recorded = modifications.some(
      (modification) => modification.target === record.id && REMOVAL_OPERATIONS.includes(modification.operation),
    );
    if (!recorded) {
      errors.push(`/${collection}/${record.id}: removed without a recorded remove or merge modification`);
    }
  }
  return errors;
}

export function reviewPlan({ before, after, findings = [], modifications = [] }) {
  const structural = [...structuralErrors(before, "before"), ...structuralErrors(after, "after")];
  if (structural.length > 0) {
    return {
      valid: false,
      errors: structural,
      before_validation_errors: [],
      after_validation_errors: [],
      before_metrics: null,
      after_metrics: null,
      checksums: null,
    };
  }

  const errors = [];
  const beforeValidation = validatePlanBundle(before);
  const afterValidation = validatePlanBundle(after);
  if (!afterValidation.valid) errors.push(...afterValidation.errors.map((error) => `/after${error}`));

  const findingIds = new Set();
  for (const [index, finding] of findings.entries()) {
    if (typeof finding.id !== "string" || findingIds.has(finding.id)) {
      errors.push(`/findings/${index}/id: missing or duplicate`);
    } else findingIds.add(finding.id);
    if (!["critical", "high", "medium", "low"].includes(finding.severity)) {
      errors.push(`/findings/${index}/severity: unknown severity`);
    }
    if (!["resolved", "open"].includes(finding.status)) errors.push(`/findings/${index}/status: unknown status`);
  }

  const modificationsByFinding = new Map();
  for (const [index, modification] of modifications.entries()) {
    if (!findingIds.has(modification.finding_id)) {
      errors.push(`/modifications/${index}: unknown finding ${modification.finding_id}`);
    }
    for (const field of ["id", "operation", "target", "rationale"]) {
      if (typeof modification[field] !== "string" || modification[field].length === 0) {
        errors.push(`/modifications/${index}/${field}: required`);
      }
    }
    modificationsByFinding.set(
      modification.finding_id,
      (modificationsByFinding.get(modification.finding_id) ?? 0) + 1,
    );
  }
  for (const finding of findings) {
    if (finding.status === "resolved" && !modificationsByFinding.has(finding.id)) {
      errors.push(`/findings/${finding.id}: resolved finding requires an exact modification`);
    }
  }

  const beforeMetrics = planMetrics(before);
  const afterMetrics = planMetrics(after);
  for (const metric of [
    "requirements_accounted_percent",
    "requirements_test_linked_percent",
    "risks_accounted_percent",
    "risks_test_linked_percent",
  ]) {
    if (afterMetrics[metric] < beforeMetrics[metric]) errors.push(`/metrics/${metric}: regression`);
  }
  if (findings.some((finding) => finding.status === "resolved") && modifications.length === 0) {
    errors.push("/modifications: review claims improvement without modifications");
  }

  const afterCaseIds = new Set(identified(after.test_cases).map((record) => record.id));
  const afterStepIds = new Set(identified(after.test_steps).map((record) => record.id));
  errors.push(...removalsWithoutModification(before.test_cases, afterCaseIds, modifications, "test_cases"));
  errors.push(...removalsWithoutModification(
    before.test_steps,
    afterStepIds,
    modifications,
    "test_steps",
    (step) => afterCaseIds.has(step.test_case_id),
  ));

  return {
    valid: errors.length === 0,
    errors,
    before_validation_errors: beforeValidation.errors,
    after_validation_errors: afterValidation.errors,
    before_metrics: beforeMetrics,
    after_metrics: afterMetrics,
    checksums: { before: checksum(canonicalJson(before)), after: checksum(canonicalJson(after)) },
  };
}

export const REVIEW_PLAN_REQUIRED_ARTIFACTS = Object.freeze([
  "review-plan/improved-plan.json",
  "review-plan/findings.csv",
  "review-plan/modifications.csv",
  "review-plan/before-after-metrics.json",
  "review-plan/checksums.json",
  "review-plan/coverage-gaps.md",
]);

export async function writeReviewPlanArtifacts(store, review) {
  const result = reviewPlan(review);
  if (!result.valid) throw new TypeError(result.errors.join("; "));
  const artifacts = [];
  artifacts.push(await store.writeArtifact(
    "review-plan/improved-plan.json",
    `${canonicalJson(review.after)}\n`,
    { type: "review-plan.improved-plan", mediaType: "application/json" },
  ));
  artifacts.push(await store.writeArtifact(
    "review-plan/findings.csv",
    serializeCsv(["id", "severity", "target", "summary", "status", "unblocker"], review.findings),
    { type: "review-plan.findings", mediaType: "text/csv" },
  ));
  artifacts.push(await store.writeArtifact(
    "review-plan/modifications.csv",
    serializeCsv(["id", "finding_id", "operation", "target", "before", "after", "rationale"], review.modifications),
    { type: "review-plan.modifications", mediaType: "text/csv" },
  ));
  artifacts.push(await store.writeArtifact(
    "review-plan/before-after-metrics.json",
    `${canonicalJson({ before: result.before_metrics, after: result.after_metrics })}\n`,
    { type: "review-plan.metrics", mediaType: "application/json" },
  ));
  artifacts.push(await store.writeArtifact(
    "review-plan/checksums.json",
    `${canonicalJson(result.checksums)}\n`,
    { type: "review-plan.checksums", mediaType: "application/json" },
  ));
  const open = review.findings.filter((finding) => finding.status === "open");
  artifacts.push(await store.writeArtifact(
    "review-plan/coverage-gaps.md",
    `# Remaining Coverage Gaps\n\n${open.length === 0 ? "None.\n" : `${open.map((finding) => `- ${finding.id}: ${finding.summary}`).join("\n")}\n`}`,
    { type: "review-plan.coverage-gaps", mediaType: "text/markdown" },
  ));
  return artifacts;
}
