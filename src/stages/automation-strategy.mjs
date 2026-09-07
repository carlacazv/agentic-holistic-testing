import { canonicalJson } from "../core/canonical.mjs";
import { markdownTable } from "../core/markdown.mjs";

export const AUTOMATION_LEVELS = Object.freeze(["unit", "component", "api", "browser-e2e", "manual"]);

export function recommendAutomationLevel(candidate) {
  if (candidate.manual_required === true) return "manual";
  if (candidate.unit_suitable === true) return "unit";
  if (candidate.component_suitable === true) return "component";
  if (candidate.api_suitable === true) return "api";
  if (candidate.browser_suitable === true) return "browser-e2e";
  return "manual";
}

export function validateAutomationStrategy(planCaseIds, rows) {
  const errors = [];
  if (!Array.isArray(planCaseIds) || !Array.isArray(rows)) return { valid: false, errors: ["case IDs and rows must be arrays"] };
  const expected = new Set(planCaseIds);
  if (expected.size === 0) errors.push("/plan_case_ids: at least one planned case is required");
  const seen = new Set();
  for (const [index, row] of rows.entries()) {
    if (!expected.has(row.test_case_id)) errors.push(`/rows/${index}: unknown case ${row.test_case_id}`);
    if (seen.has(row.test_case_id)) errors.push(`/rows/${index}: duplicate case ${row.test_case_id}`);
    seen.add(row.test_case_id);
    const recommended = recommendAutomationLevel(row);
    if (row.recommended_level !== recommended) {
      errors.push(`/rows/${row.test_case_id}/recommended_level: expected ${recommended}`);
    }
    for (const field of ["impact_value", "stability", "cost"]) {
      if (!Number.isInteger(row[field]) || row[field] < 1 || row[field] > 5) {
        errors.push(`/rows/${row.test_case_id}/${field}: expected integer 1-5`);
      }
    }
    if (!["automate", "manual", "defer"].includes(row.decision)) {
      errors.push(`/rows/${row.test_case_id}/decision: unknown decision`);
    }
    if (typeof row.rationale !== "string" || row.rationale.length === 0) {
      errors.push(`/rows/${row.test_case_id}/rationale: required`);
    }
    if (row.decision === "automate" && row.recommended_level === "manual") {
      errors.push(`/rows/${row.test_case_id}: manual recommendation cannot be automated`);
    }
    if (row.approved === true && row.decision !== "automate") {
      errors.push(`/rows/${row.test_case_id}: approval requires automate decision`);
    }
  }
  for (const caseId of expected) if (!seen.has(caseId)) errors.push(`/rows: missing planned case ${caseId}`);
  return { valid: errors.length === 0, errors };
}

export function approvedPlaywrightCandidates(rows) {
  return rows.filter((row) =>
    row.approved === true &&
    row.decision === "automate" &&
    ((row.recommended_level === "api" && row.api_suitable === true) ||
      (row.recommended_level === "browser-e2e" && row.browser_suitable === true)),
  );
}

export function automationMetrics(planCaseIds, rows) {
  const approved = approvedPlaywrightCandidates(rows);
  return {
    cases_total: planCaseIds.length,
    cases_assessed: new Set(rows.map((row) => row.test_case_id)).size,
    case_coverage_percent: planCaseIds.length === 0 ? null : Number(((new Set(rows.map((row) => row.test_case_id)).size / planCaseIds.length) * 100).toFixed(2)),
    automate: rows.filter((row) => row.decision === "automate").length,
    manual: rows.filter((row) => row.decision === "manual").length,
    deferred: rows.filter((row) => row.decision === "defer").length,
    approved_playwright_api: approved.filter((row) => row.recommended_level === "api").length,
    approved_playwright_browser: approved.filter((row) => row.recommended_level === "browser-e2e").length,
  };
}

export const AUTOMATION_REQUIRED_ARTIFACTS = Object.freeze([
  "automation-strategy/strategy.json",
  "automation-strategy/summary.md",
]);

export function automationStrategyMarkdown(planCaseIds, rows) {
  return ["# Automation Strategy", "", markdownTable(
    ["Case", "Level", "Decision", "Approved", "Impact", "Stability", "Cost", "Rationale"],
    rows.map((row) => [row.test_case_id, row.recommended_level, row.decision, row.approved, row.impact_value, row.stability, row.cost, row.rationale]),
  ), "## Metrics", "", markdownTable(["Metric", "Value"], Object.entries(automationMetrics(planCaseIds, rows))), ""].join("\n");
}

export async function writeAutomationStrategy(store, planCaseIds, rows) {
  const validation = validateAutomationStrategy(planCaseIds, rows);
  if (!validation.valid) throw new TypeError(validation.errors.join("; "));
  return Promise.all([
    store.writeArtifact("automation-strategy/strategy.json", `${canonicalJson({ plan_case_ids: planCaseIds, rows })}\n`, { type: "automation-strategy.document", mediaType: "application/json" }),
    store.writeArtifact("automation-strategy/summary.md", automationStrategyMarkdown(planCaseIds, rows), { type: "automation-strategy.summary", mediaType: "text/markdown" }),
  ]);
}
