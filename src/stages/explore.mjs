import { canonicalJson } from "../core/canonical.mjs";
import { markdownTable } from "../core/markdown.mjs";

export const EXECUTION_STATUSES = Object.freeze([
  "pass",
  "pass-with-note",
  "fail",
  "blocked",
  "not-testable",
  "not-run",
]);

export const FINDING_CLASSIFICATIONS = Object.freeze([
  "defect",
  "accepted-deviation",
  "spec-conflict",
  "improvement",
]);

export const TRACKER_RELATIONS = Object.freeze(["duplicate", "related"]);

const UNEXECUTED_STATUSES = new Set(["blocked", "not-testable", "not-run"]);

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateExecutions(session, evidenceIds, defectIds, errors) {
  if (session?.executions === undefined) return;
  if (!Array.isArray(session.executions)) {
    errors.push("/executions: expected array");
    return;
  }
  const caseIds = new Set();
  for (const [index, execution] of session.executions.entries()) {
    const label = `/executions/${execution?.case_id ?? index}`;
    if (!nonEmptyString(execution?.case_id)) errors.push(`/executions/${index}/case_id: required`);
    else if (caseIds.has(execution.case_id)) errors.push(`${label}: duplicate case execution`);
    else caseIds.add(execution.case_id);
    if (!EXECUTION_STATUSES.includes(execution?.status)) errors.push(`${label}/status: unknown status`);
    if (!nonEmptyString(execution?.notes)) errors.push(`${label}/notes: required`);
    for (const evidenceId of execution?.evidence_ids ?? []) {
      if (!evidenceIds.has(evidenceId)) errors.push(`${label}/evidence_ids: unknown ${evidenceId}`);
    }
    for (const defectId of execution?.defect_ids ?? []) {
      if (!defectIds.has(defectId)) errors.push(`${label}/defect_ids: unknown ${defectId}`);
    }
    if (execution?.status === "fail" && (execution.defect_ids?.length ?? 0) === 0) {
      errors.push(`${label}: failed execution requires a linked defect`);
    }
    if (execution?.status === "pass" && (execution.defect_ids?.length ?? 0) > 0) {
      errors.push(`${label}: passed execution cannot link a defect; use pass-with-note or fail`);
    }
  }
}

function validateReconciliation(defect, errors) {
  const label = `/defects/${defect.id}`;
  const classification = defect.classification ?? "defect";
  if (!FINDING_CLASSIFICATIONS.includes(classification)) errors.push(`${label}/classification: unknown classification`);
  if (defect.oracle_sources !== undefined && (!Array.isArray(defect.oracle_sources) || defect.oracle_sources.some((source) => !nonEmptyString(source)))) {
    errors.push(`${label}/oracle_sources: expected non-empty strings`);
  }
  if (classification !== "defect" && (defect.oracle_sources?.length ?? 0) === 0) {
    errors.push(`${label}: ${classification} requires the oracle sources that decided it`);
  }
  if (defect.tracker_refs !== undefined) {
    if (!Array.isArray(defect.tracker_refs)) errors.push(`${label}/tracker_refs: expected array`);
    for (const [index, ref] of (Array.isArray(defect.tracker_refs) ? defect.tracker_refs : []).entries()) {
      if (!nonEmptyString(ref?.ref)) errors.push(`${label}/tracker_refs/${index}/ref: required`);
      if (!TRACKER_RELATIONS.includes(ref?.relation)) errors.push(`${label}/tracker_refs/${index}/relation: unknown relation`);
    }
  }
  if (defect.cause !== undefined && !nonEmptyString(defect.cause)) errors.push(`${label}/cause: expected non-empty string`);
  if (defect.cause_evidence_ids !== undefined && !Array.isArray(defect.cause_evidence_ids)) {
    errors.push(`${label}/cause_evidence_ids: expected array`);
  }
}

export function validateExplorationSession(session) {
  const errors = [];
  const charter = session?.charter;
  if (!charter || typeof charter.mission !== "string" || charter.mission.length === 0) errors.push("/charter/mission: required");
  if (!Number.isInteger(charter?.timebox_minutes) || charter.timebox_minutes < 1) errors.push("/charter/timebox_minutes: expected positive integer");
  if (!Array.isArray(charter?.heuristics) || charter.heuristics.length === 0) errors.push("/charter/heuristics: at least one selection is required");
  for (const [index, heuristic] of (charter?.heuristics ?? []).entries()) {
    if (typeof heuristic.name !== "string" || typeof heuristic.rationale !== "string" || heuristic.rationale.length === 0) {
      errors.push(`/charter/heuristics/${index}: name and rationale required`);
    }
  }

  const evidenceIds = new Set();
  for (const [index, evidence] of (session?.evidence ?? []).entries()) {
    if (typeof evidence.id !== "string" || evidenceIds.has(evidence.id)) errors.push(`/evidence/${index}/id: missing or duplicate`);
    else evidenceIds.add(evidence.id);
    if (!['low', 'medium', 'high'].includes(evidence.confidence)) errors.push(`/evidence/${index}/confidence: unknown confidence`);
    if (typeof evidence.raw_path !== "string" || typeof evidence.durable_path !== "string") errors.push(`/evidence/${index}: raw and durable paths required`);
  }
  if (!Array.isArray(session?.notes) || session.notes.length === 0) errors.push("/notes: at least one session note is required");
  if (!Array.isArray(session?.coverage) || session.coverage.length === 0) errors.push("/coverage: at least one coverage note is required");

  const defectIds = new Set();
  for (const [index, defect] of (session?.defects ?? []).entries()) {
    if (typeof defect.id !== "string" || !/^defect-[a-z0-9-]+$/.test(defect.id) || defectIds.has(defect.id)) {
      errors.push(`/defects/${index}/id: expected unique safe defect ID`);
    } else defectIds.add(defect.id);
    if (!["confirmed", "suspected"].includes(defect.status)) errors.push(`/defects/${index}/status: unknown status`);
    for (const field of ["title", "environment", "preconditions", "expected", "actual", "reproducibility", "severity_rationale"]) {
      if (typeof defect[field] !== "string" || defect[field].length === 0) errors.push(`/defects/${defect.id ?? index}/${field}: required`);
    }
    if (!Array.isArray(defect.steps) || defect.steps.length === 0) errors.push(`/defects/${defect.id ?? index}/steps: required`);
    for (const evidenceId of defect.evidence_ids ?? []) if (!evidenceIds.has(evidenceId)) errors.push(`/defects/${defect.id}/evidence_ids: unknown ${evidenceId}`);
    for (const evidenceId of defect.cause_evidence_ids ?? []) if (!evidenceIds.has(evidenceId)) errors.push(`/defects/${defect.id}/cause_evidence_ids: unknown ${evidenceId}`);
    if (defect.status === "confirmed" && (defect.evidence_ids?.length ?? 0) === 0) errors.push(`/defects/${defect.id}: confirmed defect requires evidence`);
    validateReconciliation(defect, errors);
  }
  validateExecutions(session, evidenceIds, defectIds, errors);
  return { valid: errors.length === 0, errors };
}

/**
 * Checks that every execution record points at a case of the plan the session ran against,
 * and lists plan cases that have no execution record at all.
 */
export function reconcileExecutionsWithPlan(session, plan) {
  const planCaseIds = new Set((plan?.test_cases ?? []).map((item) => item.id));
  const executions = session?.executions ?? [];
  const executedIds = new Set(executions.map((item) => item.case_id));
  const errors = executions
    .filter((item) => !planCaseIds.has(item.case_id))
    .map((item) => `/executions/${item.case_id}: unknown plan case`);
  const unrecorded = [...planCaseIds].filter((id) => !executedIds.has(id)).sort();
  return { valid: errors.length === 0, errors, unrecorded_case_ids: unrecorded };
}

export function explorationMetrics(session) {
  const executions = session?.executions ?? [];
  const byStatus = Object.fromEntries(EXECUTION_STATUSES.map((status) => [status, 0]));
  for (const execution of executions) byStatus[execution.status] += 1;
  const byClassification = Object.fromEntries(FINDING_CLASSIFICATIONS.map((name) => [name, 0]));
  for (const defect of session?.defects ?? []) byClassification[defect.classification ?? "defect"] += 1;
  const defects = (session?.defects ?? []).filter((defect) => (defect.classification ?? "defect") === "defect");
  return {
    executions_total: executions.length,
    executions_run: executions.filter((item) => !UNEXECUTED_STATUSES.has(item.status)).length,
    ...Object.fromEntries(Object.entries(byStatus).map(([status, count]) => [`executions_${status.replaceAll("-", "_")}`, count])),
    findings_total: session?.defects?.length ?? 0,
    ...Object.fromEntries(Object.entries(byClassification).map(([name, count]) => [`findings_${name.replaceAll("-", "_")}`, count])),
    defects_confirmed: defects.filter((defect) => defect.status === "confirmed").length,
    defects_suspected: defects.filter((defect) => defect.status === "suspected").length,
    defects_with_tracker_duplicate: defects.filter((defect) => (defect.tracker_refs ?? []).some((ref) => ref.relation === "duplicate")).length,
  };
}

export function explorationRequiredArtifacts(session) {
  return [
    "explore/session.json",
    "explore/summary.md",
    ...session.defects.map((defect) => `explore/defects/${defect.id}/reproduction.md`),
  ];
}

export function explorationMarkdown(session) {
  const executions = session.executions ?? [];
  return ["# Exploratory Session", "", "## Charter", "", session.charter.mission, "",
    `- Timebox: ${session.charter.timebox_minutes} minutes`, `- Environment: ${session.charter.environment}`, "",
    ...(executions.length ? ["## Case executions", "", markdownTable(["Case", "Status", "Notes", "Defects"], executions.map((item) => [item.case_id, item.status, item.notes, (item.defect_ids ?? []).join(", ")]))] : []),
    "## Findings", "", markdownTable(["ID", "Classification", "Status", "Title", "Tracker"], session.defects.map((item) => [item.id, item.classification ?? "defect", item.status, item.title, (item.tracker_refs ?? []).map((ref) => `${ref.relation}: ${ref.ref}`).join("; ")])),
    "## Notes", "", markdownTable(["ID", "Timestamp", "Type", "Content"], session.notes.map((item) => [item.id, item.timestamp, item.type, item.content])),
    "## Coverage", "", markdownTable(["Area", "Depth", "Gap", "Notes"], session.coverage.map((item) => [item.area, item.depth, item.gap, item.notes])),
    "## Evidence", "", markdownTable(["ID", "Type", "Durable path", "Confidence", "Linked record"], session.evidence.map((item) => [item.id, item.type, item.durable_path, item.confidence, item.linked_record])), ""].join("\n");
}

function defectMarkdown(defect) {
  const reconciliation = [
    `- Classification: ${defect.classification ?? "defect"}`,
    `- Component: ${defect.component ?? "not declared"}`,
    `- Cause: ${defect.cause ?? "not yet determined"}`,
    ...(defect.oracle_sources?.length ? ["", "### Oracle sources", "", ...defect.oracle_sources.map((source) => `- ${source}`)] : []),
    ...(defect.tracker_refs?.length ? ["", "### Tracker", "", ...defect.tracker_refs.map((ref) => `- ${ref.relation}: ${ref.ref}`)] : []),
  ].join("\n");
  return `# ${defect.title}\n\n- Status: ${defect.status}\n- Environment: ${defect.environment}\n- Reproducibility: ${defect.reproducibility}\n\n## Reconciliation\n\n${reconciliation}\n\n## Preconditions\n\n${defect.preconditions}\n\n## Steps\n\n${defect.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}\n\n## Expected\n\n${defect.expected}\n\n## Actual\n\n${defect.actual}\n\n## Severity rationale\n\n${defect.severity_rationale}\n\n## Evidence\n\n${defect.evidence_ids.map((id) => `- ${id}`).join("\n") || "No evidence linked yet."}\n`;
}

export async function writeExplorationSession(store, session) {
  const validation = validateExplorationSession(session);
  if (!validation.valid) throw new TypeError(validation.errors.join("; "));
  const artifacts = [];
  artifacts.push(await store.writeArtifact("explore/session.json", `${canonicalJson(session)}\n`, { type: "explore.document", mediaType: "application/json" }));
  artifacts.push(await store.writeArtifact("explore/summary.md", explorationMarkdown(session), { type: "explore.summary", mediaType: "text/markdown" }));
  for (const defect of session.defects) {
    artifacts.push(await store.writeArtifact(`explore/defects/${defect.id}/reproduction.md`, defectMarkdown(defect), { type: "explore.defect", mediaType: "text/markdown" }));
  }
  return artifacts;
}
