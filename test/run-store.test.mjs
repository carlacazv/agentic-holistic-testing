import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { validateRunDirectory } from "../src/core/artifacts.mjs";
import { RunStore } from "../src/core/run-store.mjs";

async function workspace(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-run-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

test("run storage isolates raw evidence and finalizes validated controls", async (t) => {
  const root = await workspace(t);
  const store = new RunStore({ workspace: root, runId: "run-fixture-0001" });
  const locations = await store.initialize();
  assert.match(locations.durable_directory, /qa\/runs\/run-fixture-0001$/);
  assert.match(locations.raw_directory, /test-results\/run-fixture-0001$/);

  await store.writeRaw("browser/trace.txt", "Authorization: Bearer raw-token");
  const promoted = await store.promoteText(
    "browser/trace.txt",
    "evidence/trace.txt",
    { type: "browser.trace", mediaType: "text/plain" },
  );
  assert.equal(promoted.redaction.replacements, 1);
  const durable = await readFile(path.join(locations.durable_directory, "evidence/trace.txt"), "utf8");
  const raw = await readFile(path.join(locations.raw_directory, "browser/trace.txt"), "utf8");
  assert.equal(durable.includes("raw-token"), false);
  assert.equal(raw.includes("raw-token"), true);

  const finalized = await store.finalize({
    skill: "explore",
    status: "completed",
    requiredArtifacts: ["evidence/trace.txt"],
    metrics: { evidence_count: 1 },
  });
  assert.equal(finalized.envelope.status, "completed");
  assert.equal((await validateRunDirectory(locations.durable_directory)).valid, true);

  await writeFile(path.join(locations.durable_directory, "evidence/trace.txt"), "tampered", "utf8");
  const tampered = await validateRunDirectory(locations.durable_directory);
  assert.equal(tampered.valid, false);
  assert.match(tampered.errors.join("\n"), /checksum mismatch/);
});

test("run storage rejects path and symlink escapes", async (t) => {
  const root = await workspace(t);
  const store = new RunStore({ workspace: root, runId: "run-fixture-0002" });
  await store.initialize();
  await assert.rejects(
    store.writeArtifact("../escape.txt", "unsafe", { type: "test.data", mediaType: "text/plain" }),
    /normalized relative/,
  );
  await symlink(root, path.join(store.durableDirectory, "linked"));
  await assert.rejects(
    store.writeArtifact("linked/escape.txt", "unsafe", { type: "test.data", mediaType: "text/plain" }),
    /symbolic link/,
  );
});

test("finalization rejects false completion and accepts explicit partial and blocked states", async (t) => {
  const root = await workspace(t);
  const missingStore = new RunStore({ workspace: root, runId: "run-fixture-0003" });
  await missingStore.initialize();
  await assert.rejects(
    missingStore.finalize({ skill: "plan", status: "completed", requiredArtifacts: ["plan/test-cases.csv"] }),
    /Required artifacts/,
  );

  const partialStore = new RunStore({ workspace: root, runId: "run-fixture-0004" });
  await partialStore.initialize();
  await partialStore.writeArtifact("notes.md", "valid notes", { type: "session.notes", mediaType: "text/markdown" });
  const partial = await partialStore.finalize({
    skill: "explore",
    status: "partial",
    gaps: ["Browser capability was unavailable"],
    residualRisks: ["Interactive behavior was not covered"],
  });
  assert.equal(partial.envelope.status, "partial");

  const blockedStore = new RunStore({ workspace: root, runId: "run-fixture-0005" });
  await blockedStore.initialize();
  const blocked = await blockedStore.finalize({
    skill: "performance",
    status: "blocked",
    errors: [{
      code: "browser_unavailable",
      message: "No browser capability is available",
      recoverable: true,
      unblocker: "Configure the pinned browser integration",
    }],
    nextActions: ["Provide browser capability"],
  });
  assert.equal(blocked.envelope.status, "blocked");
});

test("completed runs require artifacts and finalized IDs cannot be recreated", async (t) => {
  const root = await workspace(t);
  const empty = new RunStore({ workspace: root, runId: "run-empty-complete-01" });
  await empty.initialize();
  await assert.rejects(empty.finalize({ skill: "plan", status: "completed" }), /non-empty required artifact/);

  const first = new RunStore({ workspace: root, runId: "run-finalized-identity-01" });
  await first.initialize();
  await first.writeArtifact("plan/plan.json", "{}", { type: "plan.document", mediaType: "application/json" });
  await first.finalize({ skill: "plan", status: "completed", requiredArtifacts: ["plan/plan.json"] });
  const duplicate = new RunStore({ workspace: root, runId: "run-finalized-identity-01" });
  await assert.rejects(duplicate.initialize(), /already finalized/);
});
