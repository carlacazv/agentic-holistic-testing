import { canonicalJson } from "../core/canonical.mjs";
import { markdownTable } from "../core/markdown.mjs";

const BASELINE_MANUAL_CRITERIA = Object.freeze([
  "1.4.3", "1.4.10", "1.4.12", "2.1.1", "2.4.7", "2.5.8", "4.1.2", "4.1.3",
]);

export function validateAccessibilityAudit(audit) {
  const errors = [];
  if (audit?.scope?.standard !== "WCAG 2.2 AA") errors.push("/scope/standard: expected WCAG 2.2 AA");
  if (!Array.isArray(audit?.scope?.pages) || audit.scope.pages.length === 0) errors.push("/scope/pages: at least one page required");
  const automatedPages = new Set((audit?.axe_results ?? []).map((result) => result.page));
  for (const page of audit?.scope?.pages ?? []) if (!automatedPages.has(page)) errors.push(`/axe_results: missing page ${page}`);

  const evidenceIds = new Set((audit?.evidence ?? []).map((entry) => entry.id));
  const defectIds = new Set((audit?.defects ?? []).map((entry) => entry.id));
  for (const result of audit?.axe_results ?? []) {
    for (const violation of result.violations ?? []) {
      if (!violation.defect_id || !defectIds.has(violation.defect_id)) errors.push(`/axe_results/${result.page}/${violation.rule_id}: violation requires linked defect`);
      if (!Array.isArray(violation.nodes) || violation.nodes.length === 0) errors.push(`/axe_results/${result.page}/${violation.rule_id}: nodes required`);
    }
  }

  const criteria = new Set();
  for (const check of audit?.manual_checks ?? []) {
    criteria.add(check.criterion);
    if (!["pass", "fail", "unresolved", "not-applicable"].includes(check.status)) errors.push(`/manual_checks/${check.criterion}/status: unknown status`);
    if (typeof check.method !== "string" || check.method.length === 0) errors.push(`/manual_checks/${check.criterion}/method: required`);
    for (const id of check.evidence_ids ?? []) if (!evidenceIds.has(id)) errors.push(`/manual_checks/${check.criterion}: unknown evidence ${id}`);
    if (["pass", "fail"].includes(check.status) && (check.evidence_ids?.length ?? 0) === 0) {
      errors.push(`/manual_checks/${check.criterion}: ${check.status} requires evidence`);
    }
    if (check.status === "fail" && (!defectIds.has(check.defect_id) || (check.evidence_ids?.length ?? 0) === 0)) {
      errors.push(`/manual_checks/${check.criterion}: failure requires evidence and linked defect`);
    }
    if (check.status === "unresolved" && (!check.reason || !check.unblocker)) {
      errors.push(`/manual_checks/${check.criterion}: unresolved check requires reason and unblocker`);
    }
    if (check.status === "not-applicable" && !check.reason) errors.push(`/manual_checks/${check.criterion}: not-applicable requires rationale`);
  }
  for (const criterion of BASELINE_MANUAL_CRITERIA) if (!criteria.has(criterion)) errors.push(`/manual_checks: missing representative criterion ${criterion}`);
  return { valid: errors.length === 0, errors };
}

export function accessibilityMetrics(audit) {
  const checks = audit.manual_checks ?? [];
  const violations = (audit.axe_results ?? []).flatMap((result) => result.violations ?? []);
  return {
    pages_scanned: new Set((audit.axe_results ?? []).map((entry) => entry.page)).size,
    axe_violations: violations.length,
    manual_pass: checks.filter((entry) => entry.status === "pass").length,
    manual_fail: checks.filter((entry) => entry.status === "fail").length,
    manual_unresolved: checks.filter((entry) => entry.status === "unresolved").length,
    manual_not_applicable: checks.filter((entry) => entry.status === "not-applicable").length,
  };
}

export function accessibilityRequiredArtifacts(audit) {
  return [
    "accessibility/audit.json",
    "accessibility/summary.md",
    ...audit.defects.map((defect) => `accessibility/defects/${defect.id}.md`),
  ];
}

export function accessibilityMarkdown(audit) {
  const unresolved = audit.manual_checks.filter((check) => check.status === "unresolved");
  return ["# Accessibility Audit", "", `- Standard: ${audit.scope.standard}`, `- Pages: ${audit.scope.pages.join(", ")}`, "",
    "## Automated results", "", markdownTable(["Page", "Violations"], audit.axe_results.map((item) => [item.page, (item.violations ?? []).length])),
    "## Manual checks", "", markdownTable(["Criterion", "Name", "Status", "Method", "Evidence", "Defect"], audit.manual_checks.map((item) => [item.criterion, item.name, item.status, item.method, (item.evidence_ids ?? []).join(", "), item.defect_id])),
    "## Unresolved criteria", "", markdownTable(["Criterion", "Reason", "Unblocker"], unresolved.map((item) => [item.criterion, item.reason, item.unblocker])),
    "## Metrics", "", markdownTable(["Metric", "Value"], Object.entries(accessibilityMetrics(audit))), ""].join("\n");
}

export async function writeAccessibilityAudit(store, audit) {
  const validation = validateAccessibilityAudit(audit);
  if (!validation.valid) throw new TypeError(validation.errors.join("; "));
  const artifacts = [];
  artifacts.push(await store.writeArtifact("accessibility/audit.json", `${canonicalJson(audit)}\n`, { type: "accessibility.document", mediaType: "application/json" }));
  artifacts.push(await store.writeArtifact("accessibility/summary.md", accessibilityMarkdown(audit), { type: "accessibility.summary", mediaType: "text/markdown" }));
  for (const defect of audit.defects) artifacts.push(await store.writeArtifact(`accessibility/defects/${defect.id}.md`, `# ${defect.title}\n\n${defect.reproduction}\n`, { type: "accessibility.defect", mediaType: "text/markdown" }));
  return artifacts;
}
