import { serializeCsv } from "../core/csv.mjs";

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
    if (defect.status === "confirmed" && (defect.evidence_ids?.length ?? 0) === 0) errors.push(`/defects/${defect.id}: confirmed defect requires evidence`);
  }
  return { valid: errors.length === 0, errors };
}

export function explorationRequiredArtifacts(session) {
  return [
    "explore/charter.md",
    "explore/session-notes.csv",
    "explore/coverage-notes.csv",
    "explore/evidence-index.csv",
    ...session.defects.map((defect) => `explore/defects/${defect.id}/reproduction.md`),
  ];
}

function defectMarkdown(defect) {
  return `# ${defect.title}\n\n- Status: ${defect.status}\n- Environment: ${defect.environment}\n- Reproducibility: ${defect.reproducibility}\n\n## Preconditions\n\n${defect.preconditions}\n\n## Steps\n\n${defect.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}\n\n## Expected\n\n${defect.expected}\n\n## Actual\n\n${defect.actual}\n\n## Severity rationale\n\n${defect.severity_rationale}\n\n## Evidence\n\n${defect.evidence_ids.map((id) => `- ${id}`).join("\n") || "No evidence linked yet."}\n`;
}

export async function writeExplorationSession(store, session) {
  const validation = validateExplorationSession(session);
  if (!validation.valid) throw new TypeError(validation.errors.join("; "));
  const artifacts = [];
  artifacts.push(await store.writeArtifact(
    "explore/charter.md",
    `# Exploratory Charter\n\n## Mission\n\n${session.charter.mission}\n\n- Timebox: ${session.charter.timebox_minutes} minutes\n- Environment: ${session.charter.environment}\n\n## Heuristics\n\n${session.charter.heuristics.map((item) => `- ${item.name}: ${item.rationale}`).join("\n")}\n`,
    { type: "explore.charter", mediaType: "text/markdown" },
  ));
  artifacts.push(await store.writeArtifact("explore/session-notes.csv", serializeCsv(["id", "timestamp", "type", "content"], session.notes), { type: "explore.notes", mediaType: "text/csv" }));
  artifacts.push(await store.writeArtifact("explore/coverage-notes.csv", serializeCsv(["area", "depth", "gap", "notes"], session.coverage), { type: "explore.coverage", mediaType: "text/csv" }));
  artifacts.push(await store.writeArtifact("explore/evidence-index.csv", serializeCsv(["id", "type", "raw_path", "durable_path", "checksum", "confidence", "linked_record"], session.evidence), { type: "explore.evidence", mediaType: "text/csv" }));
  for (const defect of session.defects) {
    artifacts.push(await store.writeArtifact(`explore/defects/${defect.id}/reproduction.md`, defectMarkdown(defect), { type: "explore.defect", mediaType: "text/markdown" }));
  }
  return artifacts;
}
