import { canonicalJson } from "../core/canonical.mjs";

export const RELEASE_RECOMMENDATIONS = Object.freeze([
  "ready", "conditional", "not-ready", "insufficient-evidence",
]);

export function recommendRelease({ runs = [], openCriticalRisks = [] } = {}) {
  if (runs.length === 0) return "insufficient-evidence";
  if (openCriticalRisks.length > 0 || runs.some((run) => run.verification_status === "fail")) return "not-ready";
  if (runs.some((run) => ["partial", "blocked", "failed"].includes(run.status))) return "insufficient-evidence";
  const verificationRuns = runs.filter((run) => !["plan", "review-plan", "automation-strategy", "report"].includes(run.skill));
  if (verificationRuns.length === 0) return "insufficient-evidence";
  if (verificationRuns.some((run) => run.verification_status === "inconclusive" || (run.gaps?.length ?? 0) > 0 || (run.residual_risks?.length ?? 0) > 0)) return "conditional";
  if (verificationRuns.some((run) => ["not-run", undefined].includes(run.verification_status))) return "insufficient-evidence";
  if (verificationRuns.every((run) => run.verification_status === "pass")) return "ready";
  return "insufficient-evidence";
}

export function buildQualityReport({ goal, runs, openCriticalRisks = [], decisionOwner = null }) {
  if (typeof goal !== "string" || goal.trim().length === 0) throw new TypeError("Quality report goal is required");
  if (!Array.isArray(runs) || runs.length === 0) throw new TypeError("Quality report requires at least one run envelope");
  const recommendation = recommendRelease({ runs, openCriticalRisks });
  return {
    goal: goal.trim(),
    recommendation,
    decision_owner: decisionOwner,
    run_ids: runs.map((run) => run.run_id).sort(),
    evidence: runs.flatMap((run) => (run.artifacts ?? []).map((artifact) => ({ run_id: run.run_id, ...artifact }))),
    gaps: [...new Set(runs.flatMap((run) => run.gaps ?? []))].sort(),
    residual_risks: [...new Set([...openCriticalRisks, ...runs.flatMap((run) => run.residual_risks ?? [])])].sort(),
    verification: runs.map((run) => ({ run_id: run.run_id, skill: run.skill, workflow_status: run.status, verification_status: run.verification_status ?? "not-run" })),
  };
}

export function reportMarkdown(report) {
  const lines = [
    "# Quality Decision Report", "", `Goal: ${report.goal}`, "",
    `Release recommendation: **${report.recommendation}**`, "",
    `Decision owner: ${report.decision_owner ?? "Not declared"}`, "", "## Verification", "",
    "| Run | Skill | Workflow | Verification |", "| --- | --- | --- | --- |",
    ...report.verification.map((item) => `| ${item.run_id} | ${item.skill} | ${item.workflow_status} | ${item.verification_status} |`),
    "", "## Remaining gaps", "", ...(report.gaps.length ? report.gaps.map((gap) => `- ${gap}`) : ["None recorded."]),
    "", "## Residual risks", "", ...(report.residual_risks.length ? report.residual_risks.map((risk) => `- ${risk}`) : ["None recorded."]), "",
  ];
  return lines.join("\n");
}

export const REPORT_REQUIRED_ARTIFACTS = Object.freeze(["report/report.json", "report/summary.md"]);

export async function writeQualityReport(store, input) {
  const report = buildQualityReport(input);
  return Promise.all([
    store.writeArtifact("report/report.json", `${canonicalJson(report)}\n`, { type: "report.document", mediaType: "application/json" }),
    store.writeArtifact("report/summary.md", reportMarkdown(report), { type: "report.summary", mediaType: "text/markdown" }),
  ]);
}
