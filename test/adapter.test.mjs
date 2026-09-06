import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildAdapter, validateSkillManifest } from "../scripts/build-adapter.mjs";

test("Codex adapter builds in a clean temporary home", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-adapter-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const result = await buildAdapter("codex", directory);
  assert.equal(result.provider, "codex");
  assert.equal(result.skills.length, 9);
  const generated = new Map(result.skills.map((entry) => [entry.id, entry]));
  assert.deepEqual([...generated.keys()].sort(), ["accessibility", "automation-strategy", "cycle", "explore", "implement-playwright", "performance", "plan", "report", "review-plan"]);
  const skill = await readFile(path.join(directory, ".agents/skills/holistic-qa-plan/SKILL.md"), "utf8");
  assert.match(skill, /name: holistic-qa-plan/);
  assert.match(skill, new RegExp(generated.get("plan").source_checksum.replace(":", "\\:")));
  const written = JSON.parse(await readFile(path.join(directory, ".agents/.holistic-qa-manifest.json"), "utf8"));
  assert.deepEqual(written, result);
});

test("Claude Code adapter builds in a clean temporary home", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-adapter-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const result = await buildAdapter("claude", directory);
  assert.equal(result.provider, "claude");
  assert.equal(result.skills.length, 9);
  const generated = new Map(result.skills.map((entry) => [entry.id, entry]));
  assert.deepEqual([...generated.keys()].sort(), ["accessibility", "automation-strategy", "cycle", "explore", "implement-playwright", "performance", "plan", "report", "review-plan"]);
  const skill = await readFile(path.join(directory, ".claude/skills/holistic-qa-plan/SKILL.md"), "utf8");
  assert.match(skill, /name: holistic-qa-plan/);
  assert.match(skill, new RegExp(generated.get("plan").source_checksum.replace(":", "\\:")));
  const written = JSON.parse(await readFile(path.join(directory, ".claude/.holistic-qa-manifest.json"), "utf8"));
  assert.deepEqual(written, result);
});

test("installing both providers into the same target does not collide", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-adapter-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const codex = await buildAdapter("codex", directory);
  const claude = await buildAdapter("claude", directory);
  const codexManifest = JSON.parse(await readFile(path.join(directory, ".agents/.holistic-qa-manifest.json"), "utf8"));
  const claudeManifest = JSON.parse(await readFile(path.join(directory, ".claude/.holistic-qa-manifest.json"), "utf8"));
  assert.deepEqual(codexManifest, codex);
  assert.deepEqual(claudeManifest, claude);
});

test("an unknown provider is rejected", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-adapter-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await assert.rejects(buildAdapter("gemini", directory), /Unsupported v1 provider/);
});

test("generated skills carry their pipeline position and prerequisites", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-adapter-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const result = await buildAdapter("claude", directory);
  const read = (id) => readFile(path.join(directory, `.claude/skills/holistic-qa-${id}/SKILL.md`), "utf8");

  const entry = await read("plan");
  assert.match(entry, /description: "Step 1 of 4 in the QA pipeline, and its entry point\./);
  assert.match(entry, /^ {2}track: pipeline$/m);
  assert.doesNotMatch(entry, /^ {2}requires:/m);

  const dependent = await read("implement-playwright");
  assert.match(dependent, /Step 4 of 4 in the QA pipeline; requires a completed holistic-qa-automation-strategy run\./);
  assert.match(dependent, /^ {2}requires: "holistic-qa-automation-strategy"$/m);

  const audit = await read("performance");
  assert.match(audit, /description: "Independent audit that runs against an authorized target environment and needs no plan\./);
  assert.match(audit, /^ {2}track: audit$/m);
  assert.doesNotMatch(audit, /^ {2}requires:/m);

  const coordinator = await read("cycle");
  assert.match(coordinator, /description: "Optional workflow coordinator\./);
  assert.match(coordinator, /^ {2}track: orchestrator$/m);

  const manifestEntry = result.skills.find((skill) => skill.id === "review-plan");
  assert.deepEqual(manifestEntry.requires, ["plan"]);
  assert.equal(manifestEntry.track, "pipeline");
});

test("each provider ships an index naming the order in its own invocation syntax", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-adapter-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await buildAdapter("codex", directory);
  await buildAdapter("claude", directory);

  const codexIndex = await readFile(path.join(directory, ".agents/holistic-qa-README.md"), "utf8");
  assert.match(codexIndex, /1\. `holistic-qa-plan`/);
  assert.match(codexIndex, /4\. `holistic-qa-implement-playwright`/);
  assert.match(codexIndex, /## Independent audits/);
  assert.match(codexIndex, /## Optional orchestration/);
  assert.match(codexIndex, /`holistic-qa-cycle`/);
  assert.match(codexIndex, /`\.agents\/skills\/`/);

  const claudeIndex = await readFile(path.join(directory, ".claude/holistic-qa-README.md"), "utf8");
  assert.match(claudeIndex, /1\. `holistic-qa-plan`/);
  assert.doesNotMatch(claudeIndex, /holistic-qa:/);
});

test("a manifest with an inconsistent prerequisite chain is rejected", () => {
  const manifest = (skills) => ({ schema_version: 1, skills });
  const skill = (id, track, requires) => ({ id, track, requires, description: `${id} description` });

  assert.doesNotThrow(() => validateSkillManifest(manifest([
    skill("plan", "pipeline", []),
    skill("review-plan", "pipeline", ["plan"]),
    skill("explore", "audit", []),
  ])));

  assert.throws(
    () => validateSkillManifest(manifest([skill("review-plan", "pipeline", ["plan"])])),
    /unknown prerequisite plan/,
  );
  assert.throws(
    () => validateSkillManifest(manifest([skill("plan", "pipeline", []), skill("explore", "audit", ["plan"])])),
    /audit skill cannot declare prerequisites/,
  );
  assert.throws(
    () => validateSkillManifest(manifest([skill("plan", "queue", [])])),
    /track must be one of pipeline, audit, orchestrator/,
  );
  assert.throws(
    () => validateSkillManifest(manifest([
      skill("plan", "pipeline", ["review-plan"]),
      skill("review-plan", "pipeline", ["plan"]),
    ])),
    /Cyclic skill prerequisite/,
  );
});
