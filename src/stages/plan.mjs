import { canonicalJson } from "../core/canonical.mjs";
import { markdownTable } from "../core/markdown.mjs";

export const PLAN_TECHNIQUES = Object.freeze([
  "equivalence-partitioning",
  "boundary-value-analysis",
  "decision-table",
  "state-transition",
  "scenario-testing",
  "pairwise-selection",
  "error-guessing",
]);

export const COVERAGE_DISPOSITIONS = Object.freeze([
  "deferred",
  "waived",
  "externally-covered",
  "not-testable",
]);

export function priorityForExposure(exposure) {
  if (!Number.isInteger(exposure) || exposure < 1 || exposure > 25) {
    throw new TypeError("Exposure must be an integer from 1 through 25");
  }
  if (exposure >= 20) return "P0";
  if (exposure >= 12) return "P1";
  if (exposure >= 6) return "P2";
  return "P3";
}

export function scoreRisk(risk) {
  if (!Number.isInteger(risk.impact) || risk.impact < 1 || risk.impact > 5) {
    throw new TypeError(`${risk.id ?? "risk"}: impact must be an integer from 1 through 5`);
  }
  if (!Number.isInteger(risk.likelihood) || risk.likelihood < 1 || risk.likelihood > 5) {
    throw new TypeError(`${risk.id ?? "risk"}: likelihood must be an integer from 1 through 5`);
  }
  const exposure = risk.impact * risk.likelihood;
  return { ...risk, exposure, priority: priorityForExposure(exposure) };
}

function ids(records, collection, errors) {
  if (!Array.isArray(records)) {
    errors.push(`/${collection}: expected array`);
    return new Set();
  }
  const result = new Set();
  for (const [index, record] of records.entries()) {
    if (record === null || typeof record !== "object" || typeof record.id !== "string" || record.id.length === 0) {
      errors.push(`/${collection}/${index}/id: expected non-empty string`);
    } else if (result.has(record.id)) {
      errors.push(`/${collection}/${index}/id: duplicate ${record.id}`);
    } else {
      result.add(record.id);
    }
  }
  return result;
}

function validateDisposition(record, collection, linked, errors) {
  if (linked) return;
  if (!COVERAGE_DISPOSITIONS.includes(record.disposition)) {
    errors.push(`/${collection}/${record.id}: unlinked record requires an allowed disposition`);
  }
  if (typeof record.disposition_rationale !== "string" || record.disposition_rationale.length === 0) {
    errors.push(`/${collection}/${record.id}: disposition requires rationale`);
  }
}

export function validatePlanBundle(bundle) {
  const errors = [];
  if (bundle === null || typeof bundle !== "object" || Array.isArray(bundle)) {
    return { valid: false, errors: ["/: expected object"] };
  }
  const requirementIds = ids(bundle.requirements, "requirements", errors);
  const riskIds = ids(bundle.risks, "risks", errors);
  const caseIds = ids(bundle.test_cases, "test_cases", errors);
  ids(bundle.test_steps, "test_steps", errors);

  if (requirementIds.size === 0) errors.push("/requirements: at least one authoritative requirement is required");
  if (riskIds.size === 0) errors.push("/risks: at least one identified risk is required");
  if (caseIds.size === 0) errors.push("/test_cases: at least one test case is required");
  if (!Array.isArray(bundle.test_steps) || bundle.test_steps.length === 0) {
    errors.push("/test_steps: at least one test step is required");
  }

  for (const requirement of bundle.requirements ?? []) {
    if (typeof requirement.title !== "string" || requirement.title.trim().length === 0) {
      errors.push(`/requirements/${requirement.id ?? "unknown"}/title: required`);
    }
    if (typeof requirement.acceptance_criteria !== "string" || requirement.acceptance_criteria.trim().length === 0) {
      errors.push(`/requirements/${requirement.id ?? "unknown"}/acceptance_criteria: required`);
    }
  }

  for (const risk of bundle.risks ?? []) {
    try {
      const scored = scoreRisk(risk);
      if (risk.exposure !== scored.exposure) errors.push(`/risks/${risk.id}/exposure: expected ${scored.exposure}`);
      if (risk.priority !== scored.priority) errors.push(`/risks/${risk.id}/priority: expected ${scored.priority}`);
    } catch (error) {
      errors.push(`/risks/${risk.id ?? "unknown"}: ${error.message}`);
    }
  }

  const requirementLinks = new Map([...requirementIds].map((id) => [id, new Set()]));
  const riskLinks = new Map([...riskIds].map((id) => [id, new Set()]));
  const caseLinks = new Map([...caseIds].map((id) => [id, 0]));
  for (const [index, link] of (bundle.requirement_test_links ?? []).entries()) {
    if (!requirementIds.has(link.requirement_id)) errors.push(`/requirement_test_links/${index}: unknown requirement ${link.requirement_id}`);
    if (!caseIds.has(link.test_case_id)) errors.push(`/requirement_test_links/${index}: unknown test case ${link.test_case_id}`);
    if (requirementLinks.has(link.requirement_id) && caseIds.has(link.test_case_id)) {
      requirementLinks.get(link.requirement_id).add(link.test_case_id);
      caseLinks.set(link.test_case_id, caseLinks.get(link.test_case_id) + 1);
    }
  }
  for (const [index, link] of (bundle.risk_test_links ?? []).entries()) {
    if (!riskIds.has(link.risk_id)) errors.push(`/risk_test_links/${index}: unknown risk ${link.risk_id}`);
    if (!caseIds.has(link.test_case_id)) errors.push(`/risk_test_links/${index}: unknown test case ${link.test_case_id}`);
    if (riskLinks.has(link.risk_id) && caseIds.has(link.test_case_id)) {
      riskLinks.get(link.risk_id).add(link.test_case_id);
      caseLinks.set(link.test_case_id, caseLinks.get(link.test_case_id) + 1);
    }
  }

  for (const requirement of bundle.requirements ?? []) {
    validateDisposition(requirement, "requirements", requirementLinks.get(requirement.id)?.size > 0, errors);
  }
  for (const risk of bundle.risks ?? []) {
    validateDisposition(risk, "risks", riskLinks.get(risk.id)?.size > 0, errors);
  }
  for (const testCase of bundle.test_cases ?? []) {
    if (!PLAN_TECHNIQUES.includes(testCase.technique)) {
      errors.push(`/test_cases/${testCase.id}/technique: unknown technique`);
    }
    if (typeof testCase.rationale !== "string" || testCase.rationale.length === 0) {
      errors.push(`/test_cases/${testCase.id}/rationale: required`);
    }
    if (caseLinks.get(testCase.id) === 0) errors.push(`/test_cases/${testCase.id}: test case is not traceable`);
  }

  const stepsByCase = new Map([...caseIds].map((id) => [id, []]));
  for (const [index, step] of (bundle.test_steps ?? []).entries()) {
    if (typeof step.action !== "string" || step.action.trim().length === 0) {
      errors.push(`/test_steps/${index}/action: required`);
    }
    if (typeof step.expected !== "string" || step.expected.trim().length === 0) {
      errors.push(`/test_steps/${index}/expected: required`);
    }
    if (!caseIds.has(step.test_case_id)) {
      errors.push(`/test_steps/${index}: unknown test case ${step.test_case_id}`);
    } else {
      stepsByCase.get(step.test_case_id).push(step);
    }
  }
  for (const [caseId, steps] of stepsByCase) {
    if (steps.length === 0) errors.push(`/test_cases/${caseId}: test case has no steps`);
    const sequences = steps.map((step) => step.sequence);
    if (new Set(sequences).size !== sequences.length || sequences.some((value) => !Number.isInteger(value) || value < 1)) {
      errors.push(`/test_cases/${caseId}: step sequences must be unique positive integers`);
    }
  }

  const boundaryGroups = new Map();
  for (const testCase of bundle.test_cases ?? []) {
    if (testCase.technique !== "boundary-value-analysis") continue;
    if (typeof testCase.boundary_group !== "string" || !["below", "at", "above"].includes(testCase.boundary_role)) {
      errors.push(`/test_cases/${testCase.id}: boundary cases require group and below/at/above role`);
      continue;
    }
    if (!boundaryGroups.has(testCase.boundary_group)) boundaryGroups.set(testCase.boundary_group, new Set());
    boundaryGroups.get(testCase.boundary_group).add(testCase.boundary_role);
  }
  for (const [group, roles] of boundaryGroups) {
    for (const role of ["below", "at", "above"]) {
      if (!roles.has(role)) errors.push(`/test_cases: boundary group ${group} is missing ${role}`);
    }
  }

  const heuristics = new Map((bundle.heuristics ?? []).map((entry) => [entry.name, entry]));
  for (const name of ["SFDIPOT", "FEW HICCUPPS"]) {
    const entry = heuristics.get(name);
    if (!entry || typeof entry.selected !== "boolean" || typeof entry.rationale !== "string" || entry.rationale.length === 0) {
      errors.push(`/heuristics: ${name} requires selected and rationale`);
    }
  }
  if (!Array.isArray(bundle.test_data_prerequisites)) {
    errors.push("/test_data_prerequisites: expected array");
  }
  return { valid: errors.length === 0, errors };
}

function percent(numerator, denominator) {
  return denominator === 0 ? null : Number(((numerator / denominator) * 100).toFixed(2));
}

export function planMetrics(bundle) {
  const requirementLinked = new Set((bundle.requirement_test_links ?? []).map((link) => link.requirement_id));
  const riskLinked = new Set((bundle.risk_test_links ?? []).map((link) => link.risk_id));
  const requirementAccounted = (bundle.requirements ?? []).filter(
    (item) => requirementLinked.has(item.id) || COVERAGE_DISPOSITIONS.includes(item.disposition),
  ).length;
  const riskAccounted = (bundle.risks ?? []).filter(
    (item) => riskLinked.has(item.id) || COVERAGE_DISPOSITIONS.includes(item.disposition),
  ).length;
  return {
    requirements_total: bundle.requirements?.length ?? 0,
    requirements_accounted_percent: percent(requirementAccounted, bundle.requirements?.length ?? 0),
    requirements_test_linked_percent: percent(requirementLinked.size, bundle.requirements?.length ?? 0),
    risks_total: bundle.risks?.length ?? 0,
    risks_accounted_percent: percent(riskAccounted, bundle.risks?.length ?? 0),
    risks_test_linked_percent: percent(riskLinked.size, bundle.risks?.length ?? 0),
    test_cases_total: bundle.test_cases?.length ?? 0,
    test_steps_total: bundle.test_steps?.length ?? 0,
  };
}

export function planMarkdown(bundle) {
  const metrics = planMetrics(bundle);
  return [
    "# Quality Plan", "", "## Requirements", "",
    markdownTable(["ID", "Title", "Acceptance criteria", "Disposition", "Rationale"], bundle.requirements.map((item) => [item.id, item.title, item.acceptance_criteria, item.disposition, item.disposition_rationale])),
    "## Risks", "", markdownTable(["ID", "Title", "Exposure", "Priority", "Disposition", "Rationale"], bundle.risks.map((item) => [item.id, item.title, item.exposure, item.priority, item.disposition, item.disposition_rationale])),
    "## Test cases and steps", "", markdownTable(["Case", "Technique", "Rationale", "Step", "Action", "Expected"], bundle.test_cases.flatMap((item) => {
      const steps = bundle.test_steps.filter((step) => step.test_case_id === item.id).sort((a, b) => a.sequence - b.sequence);
      return steps.map((step) => [item.id, item.technique, item.rationale, step.sequence, step.action, step.expected]);
    })),
    "## Test data prerequisites", "", ...(bundle.test_data_prerequisites.length ? bundle.test_data_prerequisites.map((item) => `- ${item}`) : ["None."]), "",
    "## Heuristics", "", markdownTable(["Name", "Selected", "Rationale"], bundle.heuristics.map((item) => [item.name, item.selected, item.rationale])),
    "## Coverage", "", markdownTable(["Metric", "Value"], Object.entries(metrics)), "",
  ].join("\n");
}

export async function writePlanBundle(store, bundle) {
  const validation = validatePlanBundle(bundle);
  if (!validation.valid) throw new TypeError(validation.errors.join("; "));
  return Promise.all([
    store.writeArtifact("plan/plan.json", `${canonicalJson(bundle)}\n`, { type: "plan.document", mediaType: "application/json" }),
    store.writeArtifact("plan/summary.md", planMarkdown(bundle), { type: "plan.summary", mediaType: "text/markdown" }),
  ]);
}

export const PLAN_REQUIRED_ARTIFACTS = Object.freeze([
  "plan/plan.json",
  "plan/summary.md",
]);
