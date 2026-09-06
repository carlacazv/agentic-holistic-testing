import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { RunStore } from "../src/core/run-store.mjs";
import { accessibilityMetrics, accessibilityRequiredArtifacts, validateAccessibilityAudit, writeAccessibilityAudit } from "../src/stages/accessibility.mjs";

const criteria = ["1.4.3", "1.4.10", "1.4.12", "2.1.1", "2.4.7", "2.5.8", "4.1.2", "4.1.3"];
function fixture() {
  return {
    scope: { standard: "WCAG 2.2 AA", pages: ["/"], viewports: ["1280x720", "320x640"], input_methods: ["keyboard", "pointer"], assistive_technologies: ["screen-reader inspection"] },
    axe_results: [{ page: "/", violations: [] }],
    manual_checks: criteria.map((criterion) => ({ criterion, name: `Criterion ${criterion}`, status: "pass", method: "Manual inspection", evidence_ids: ["evidence-a11y"], defect_id: "", reason: "", unblocker: "" })),
    evidence: [{ id: "evidence-a11y", type: "manual-notes", path: "accessibility/manual.md", checksum: `sha256:${"0".repeat(64)}`, criterion: "multiple" }],
    defects: []
  };
}

test("axe plus representative manual evidence forms a complete audit", () => {
  const audit = fixture();
  assert.deepEqual(validateAccessibilityAudit(audit), { valid: true, errors: [] });
  assert.equal(accessibilityMetrics(audit).manual_pass, 8);
});

test("axe-only and unlinked failures cannot claim completion", () => {
  const axeOnly = fixture();
  axeOnly.manual_checks = [];
  assert.match(validateAccessibilityAudit(axeOnly).errors.join("\n"), /missing representative criterion/);
  const failed = fixture();
  failed.manual_checks[0].status = "fail";
  failed.manual_checks[0].defect_id = "missing-defect";
  assert.match(validateAccessibilityAudit(failed).errors.join("\n"), /requires evidence and linked defect/);
});

test("manual pass claims require valid evidence", () => {
  const unsupported = fixture();
  unsupported.manual_checks[0].evidence_ids = [];
  assert.match(validateAccessibilityAudit(unsupported).errors.join("\n"), /pass requires evidence/);
});

test("accessibility artifacts finalize", async (t) => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-a11y-"));
  t.after(() => rm(workspace, { recursive: true, force: true }));
  const store = new RunStore({ workspace, runId: "run-a11y-0001" });
  await store.initialize();
  const audit = fixture();
  assert.equal((await writeAccessibilityAudit(store, audit)).length, 6);
  const result = await store.finalize({ skill: "accessibility", status: "completed", requiredArtifacts: accessibilityRequiredArtifacts(audit) });
  assert.equal(result.envelope.status, "completed");
});
