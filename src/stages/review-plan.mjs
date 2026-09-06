import { canonicalJson } from "../core/canonical.mjs";
import { checksum } from "../core/checksum.mjs";
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

export const REVIEW_MODES = Object.freeze(["apply", "complement"]);

const RECORD_COLLECTIONS = Object.freeze(["requirements", "risks", "test_cases", "test_steps"]);
const LINK_COLLECTIONS = Object.freeze(["requirement_test_links", "risk_test_links"]);

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

function complementErrors(before, after) {
  const errors = [];
  for (const collection of RECORD_COLLECTIONS) {
    const afterRecords = new Map(identified(after[collection]).map((record) => [record.id, record]));
    for (const record of identified(before[collection])) {
      const kept = afterRecords.get(record.id);
      if (kept === undefined) {
        errors.push(`/complement/${collection}/${record.id}: a complement must not remove an existing record`);
      } else if (canonicalJson(kept) !== canonicalJson(record)) {
        errors.push(`/complement/${collection}/${record.id}: a complement must not change an existing record`);
      }
    }
  }
  for (const collection of LINK_COLLECTIONS) {
    const afterLinks = new Set((after[collection] ?? []).map((link) => canonicalJson(link)));
    for (const [index, link] of (before[collection] ?? []).entries()) {
      if (!afterLinks.has(canonicalJson(link))) {
        errors.push(`/complement/${collection}/${index}: a complement must not remove an existing link`);
      }
    }
  }
  return errors;
}

export function reviewPlan({ before, after, findings = [], modifications = [], mode }) {
  const structural = [...structuralErrors(before, "before"), ...structuralErrors(after, "after")];
  if (structural.length > 0) {
    return {
      valid: false,
      errors: structural,
      mode,
      before_validation_errors: [],
      after_validation_errors: [],
      before_metrics: null,
      after_metrics: null,
      checksums: null,
    };
  }

  const errors = [];
  if (!REVIEW_MODES.includes(mode)) errors.push(`/mode: expected one of ${REVIEW_MODES.join(", ")}`);
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

  const beforeChecksum = checksum(canonicalJson(before));
  const afterChecksum = checksum(canonicalJson(after));
  if (findings.some((finding) => finding.status === "resolved") && beforeChecksum === afterChecksum) {
    errors.push("/modifications: resolved findings require a real change to the reviewed plan");
  }
  for (const [index, modification] of modifications.entries()) {
    if (modification.target === "" || modification.target === undefined) continue;
    const targetExists = PLAN_COLLECTIONS.some((collection) =>
      collection === modification.target || identified(before[collection]).some((record) => record.id === modification.target) ||
      identified(after[collection]).some((record) => record.id === modification.target));
    if (!targetExists) errors.push(`/modifications/${index}/target: ${modification.target} does not identify a plan record or collection`);
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

  if (mode === "complement") {
    errors.push(...complementErrors(before, after));
  } else {
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
  }

  return {
    valid: errors.length === 0,
    errors,
    mode,
    before_validation_errors: beforeValidation.errors,
    after_validation_errors: afterValidation.errors,
    before_metrics: beforeMetrics,
    after_metrics: afterMetrics,
    checksums: { before: beforeChecksum, after: afterChecksum },
  };
}

export const REVIEW_PLAN_REQUIRED_ARTIFACTS = Object.freeze([
  "review-plan/improved-plan.json",
  "review-plan/review.md",
]);

function cell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/\r?\n/g, " ");
}

function table(headers, rows) {
  if (rows.length === 0) return "None.\n";
  const separator = headers.map(() => "---");
  const body = rows.map((row) => `| ${row.map(cell).join(" | ")} |`).join("\n");
  return `| ${headers.join(" | ")} |\n| ${separator.join(" | ")} |\n${body}\n`;
}

export function reviewMarkdown(review, result) {
  const findings = review.findings ?? [];
  const modifications = review.modifications ?? [];
  const open = findings.filter((finding) => finding.status === "open");
  return [
    "# Plan Review",
    "",
    `- Mode: ${result.mode}`,
    `- Bundle before: ${result.checksums.before}`,
    `- Bundle after: ${result.checksums.after}`,
    "",
    "## Findings",
    "",
    table(
      ["ID", "Severity", "Target", "Status", "Summary", "Unblocker"],
      findings.map((finding) => [finding.id, finding.severity, finding.target, finding.status, finding.summary, finding.unblocker]),
    ),
    "## Modifications",
    "",
    table(
      ["ID", "Finding", "Operation", "Target", "Before", "After", "Rationale"],
      modifications.map((modification) => [
        modification.id, modification.finding_id, modification.operation,
        modification.target, modification.before, modification.after, modification.rationale,
      ]),
    ),
    "## Coverage",
    "",
    table(
      ["Metric", "Before", "After"],
      Object.keys(result.before_metrics).map((metric) => [metric, result.before_metrics[metric], result.after_metrics[metric]]),
    ),
    "## Remaining gaps",
    "",
    open.length === 0 ? "None.\n" : `${open.map((finding) => `- ${finding.id}: ${finding.summary}`).join("\n")}\n`,
  ].join("\n");
}

export async function writeReviewPlanArtifacts(store, review) {
  const result = reviewPlan(review);
  if (!result.valid) throw new TypeError(result.errors.join("; "));
  return [
    await store.writeArtifact(
      "review-plan/improved-plan.json",
      `${canonicalJson(review.after)}\n`,
      { type: "review-plan.improved-plan", mediaType: "application/json" },
    ),
    await store.writeArtifact(
      "review-plan/review.md",
      reviewMarkdown(review, result),
      { type: "review-plan.review", mediaType: "text/markdown" },
    ),
  ];
}
