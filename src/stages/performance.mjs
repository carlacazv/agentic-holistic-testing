import { canonicalJson } from "../core/canonical.mjs";
import { markdownTable } from "../core/markdown.mjs";

export const BUDGET_SOURCES = Object.freeze(["lighthouse", "api"]);
export const BUDGET_DIRECTIONS = Object.freeze(["max", "min"]);
export const BUDGET_STATISTICS = Object.freeze(["min", "median", "p95", "max"]);
export const MINIMUM_RUNS_PER_PAGE = 3;

export function distribution(values) {
  if (!Array.isArray(values) || values.length < 3 || values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new TypeError("A timing distribution requires at least three non-negative finite samples");
  }
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
  return {
    samples: sorted.length,
    min: sorted[0],
    median: Number(median.toFixed(2)),
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
    max: sorted.at(-1),
  };
}

function actualForBudget(audit, budget) {
  if (budget.source === "api") {
    const timing = audit.api_timings.find((entry) => entry.endpoint === budget.target);
    return timing ? distribution(timing.samples_ms)[budget.statistic] : undefined;
  }
  const values = audit.lighthouse_runs
    .filter((entry) => entry.page === budget.target)
    .map((entry) => entry.metrics[budget.metric])
    .filter(Number.isFinite);
  if (values.length < 3) return undefined;
  return distribution(values)[budget.statistic];
}

function satisfiesBudget(actual, budget) {
  if (actual === undefined || !Number.isFinite(budget.threshold)) return false;
  if (budget.direction === "max") return actual <= budget.threshold;
  if (budget.direction === "min") return actual >= budget.threshold;
  return false;
}

export function validateBudget(budget, at) {
  const errors = [];
  if (typeof budget?.id !== "string" || budget.id.length === 0) errors.push(`/budgets/${at}/id: required`);
  if (!BUDGET_SOURCES.includes(budget?.source)) errors.push(`/budgets/${at}/source: expected one of ${BUDGET_SOURCES.join(", ")}`);
  if (typeof budget?.target !== "string" || budget.target.length === 0) errors.push(`/budgets/${at}/target: required`);
  if (typeof budget?.metric !== "string" || budget.metric.length === 0) errors.push(`/budgets/${at}/metric: required`);
  if (!BUDGET_STATISTICS.includes(budget?.statistic)) errors.push(`/budgets/${at}/statistic: expected one of ${BUDGET_STATISTICS.join(", ")}`);
  if (!BUDGET_DIRECTIONS.includes(budget?.direction)) errors.push(`/budgets/${at}/direction: expected one of ${BUDGET_DIRECTIONS.join(", ")}`);
  if (!Number.isFinite(budget?.threshold)) errors.push(`/budgets/${at}/threshold: expected a finite number`);
  if (typeof budget?.unit !== "string" || budget.unit.length === 0) errors.push(`/budgets/${at}/unit: required`);
  return errors;
}

export function evaluateBudgets(audit) {
  return (audit.budgets ?? []).map((budget) => {
    const actual = actualForBudget(audit, budget);
    return { ...budget, actual, passed: satisfiesBudget(actual, budget) };
  });
}

export function validatePerformanceAudit(audit) {
  const errors = [];
  if (!["budget", "baseline"].includes(audit?.mode)) errors.push("/mode: expected budget or baseline");
  if (!Array.isArray(audit?.scope?.pages) || !Array.isArray(audit?.scope?.endpoints)) errors.push("/scope: pages and endpoints required");
  if ((audit?.lighthouse_runs?.length ?? 0) < MINIMUM_RUNS_PER_PAGE) errors.push("/lighthouse_runs: at least three comparable runs required");
  const runsByPage = new Map();
  for (const entry of audit?.lighthouse_runs ?? []) runsByPage.set(entry.page, (runsByPage.get(entry.page) ?? 0) + 1);
  for (const page of audit?.scope?.pages ?? []) {
    const runs = runsByPage.get(page) ?? 0;
    if (runs === 0) errors.push(`/lighthouse_runs: missing page ${page}`);
    else if (runs < MINIMUM_RUNS_PER_PAGE) errors.push(`/lighthouse_runs: page ${page} requires at least three comparable runs`);
  }
  for (const timing of audit?.api_timings ?? []) {
    try { distribution(timing.samples_ms); } catch (error) { errors.push(`/api_timings/${timing.endpoint}: ${error.message}`); }
    if (!Array.isArray(timing.errors)) errors.push(`/api_timings/${timing.endpoint}/errors: required`);
  }
  const timingEndpoints = new Set((audit?.api_timings ?? []).map((entry) => entry.endpoint));
  for (const endpoint of audit?.scope?.endpoints ?? []) if (!timingEndpoints.has(endpoint)) errors.push(`/api_timings: missing endpoint ${endpoint}`);
  if (typeof audit?.variability_notes !== "string" || audit.variability_notes.length === 0) errors.push("/variability_notes: required");
  if (audit?.mode === "budget" && (audit.budgets?.length ?? 0) === 0) errors.push("/budgets: budget mode requires thresholds");
  for (const [index, budget] of (audit?.budgets ?? []).entries()) {
    errors.push(...validateBudget(budget, typeof budget?.id === "string" && budget.id.length > 0 ? budget.id : index));
  }
  if (audit?.mode === "baseline" && (audit.budgets?.length ?? 0) > 0) errors.push("/budgets: baseline mode must not invent thresholds");

  const defectIds = new Set((audit?.defects ?? []).map((defect) => defect.id));
  const evaluations = evaluateBudgets(audit);
  for (const evaluation of evaluations) {
    if (evaluation.actual === undefined) errors.push(`/budgets/${evaluation.id}: comparable samples unavailable`);
    if (!evaluation.passed) {
      const regression = (audit.regressions ?? []).find((entry) => entry.budget_id === evaluation.id);
      if (!regression || !defectIds.has(regression.defect_id)) errors.push(`/regressions: failed budget ${evaluation.id} requires linked defect`);
    }
  }
  return { valid: errors.length === 0, errors, evaluations };
}

export function performanceMetrics(audit) {
  const evaluations = evaluateBudgets(audit);
  return {
    mode: audit.mode,
    lighthouse_runs: audit.lighthouse_runs.length,
    api_endpoints: audit.api_timings.length,
    budgets_total: evaluations.length,
    budgets_passed: evaluations.filter((entry) => entry.passed).length,
    budgets_failed: evaluations.filter((entry) => !entry.passed).length,
    sla_claimed: audit.mode === "budget",
  };
}

export function performanceRequiredArtifacts(audit) {
  return [
    "performance/audit.json", "performance/summary.md",
    ...audit.defects.map((defect) => `performance/defects/${defect.id}.md`),
  ];
}

export function canonicalPerformanceAudit(audit) {
  return {
    ...audit,
    budgets: evaluateBudgets(audit),
    api_timings: audit.api_timings.map((entry) => ({ ...entry, summary: distribution(entry.samples_ms) })),
    uncertainty: audit.mode === "baseline" ? "No SLA was supplied; values are a comparable baseline only." : null,
  };
}

export function performanceMarkdown(audit) {
  const document = canonicalPerformanceAudit(audit);
  return ["# Performance Audit", "", `- Mode: ${audit.mode}`, `- Environment: ${audit.scope.environment}`, `- Conditions: ${audit.scope.conditions}`, "",
    "## Budgets", "", markdownTable(["ID", "Source", "Target", "Metric", "Threshold", "Actual", "Direction", "Passed"], document.budgets.map((item) => [item.id, item.source, item.target, item.metric, item.threshold, item.actual, item.direction, item.passed])),
    "## API distributions", "", markdownTable(["Endpoint", "Samples", "Min", "Median", "P95", "Max"], document.api_timings.map((item) => [item.endpoint, item.summary.samples, item.summary.min, item.summary.median, item.summary.p95, item.summary.max])),
    "## Variability", "", audit.variability_notes, "", "## Uncertainty", "", document.uncertainty ?? "None declared.", "",
    "## Metrics", "", markdownTable(["Metric", "Value"], Object.entries(performanceMetrics(audit))), ""].join("\n");
}

export async function writePerformanceAudit(store, audit) {
  const validation = validatePerformanceAudit(audit);
  if (!validation.valid) throw new TypeError(validation.errors.join("; "));
  const artifacts = [];
  artifacts.push(await store.writeArtifact("performance/audit.json", `${canonicalJson(canonicalPerformanceAudit(audit))}\n`, { type: "performance.document", mediaType: "application/json" }));
  artifacts.push(await store.writeArtifact("performance/summary.md", performanceMarkdown(audit), { type: "performance.summary", mediaType: "text/markdown" }));
  for (const defect of audit.defects) artifacts.push(await store.writeArtifact(`performance/defects/${defect.id}.md`, `# ${defect.title}\n\n${defect.reproduction}\n`, { type: "performance.defect", mediaType: "text/markdown" }));
  return artifacts;
}
