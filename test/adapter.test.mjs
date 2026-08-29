import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildAdapter } from "../scripts/build-adapter.mjs";

test("Codex adapter builds in a clean temporary home", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-adapter-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const result = await buildAdapter("codex", directory);
  assert.equal(result.provider, "codex");
  assert.equal(result.skills.length, 7);
  const generated = new Map(result.skills.map((entry) => [entry.id, entry]));
  assert.deepEqual([...generated.keys()].sort(), ["accessibility", "automation-strategy", "explore", "implement-playwright", "performance", "plan", "review-plan"]);
  const skill = await readFile(path.join(directory, ".agents/skills/holistic-qa-plan/SKILL.md"), "utf8");
  assert.match(skill, /name: holistic-qa:plan/);
  assert.match(skill, new RegExp(generated.get("plan").source_checksum.replace(":", "\\:")));
  const written = JSON.parse(await readFile(path.join(directory, ".agents/.holistic-qa-manifest.json"), "utf8"));
  assert.deepEqual(written, result);
});

test("Claude Code adapter builds in a clean temporary home", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-adapter-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const result = await buildAdapter("claude", directory);
  assert.equal(result.provider, "claude");
  assert.equal(result.skills.length, 7);
  const generated = new Map(result.skills.map((entry) => [entry.id, entry]));
  assert.deepEqual([...generated.keys()].sort(), ["accessibility", "automation-strategy", "explore", "implement-playwright", "performance", "plan", "review-plan"]);
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
