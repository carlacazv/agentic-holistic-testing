import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

const cli = path.resolve("src/cli.mjs");

async function fixtureDirectory(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-cli-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

function run(...arguments_) {
  return spawnSync(process.execPath, [cli, ...arguments_], { encoding: "utf8" });
}

test("CLI validates documents and uses deterministic JSON output", async (t) => {
  const directory = await fixtureDirectory(t);
  const file = path.join(directory, "context.json");
  await writeFile(file, JSON.stringify({
    environment: "test",
    mode: "autonomous",
    production_authorized: false,
    allowed_capabilities: ["read-page"],
    approvals: [],
    credentials: [],
  }));
  const result = run("validate", "execution-context", file);
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '{"errors":[],"valid":true}\n');
});

test("CLI returns distinct denial and argument exit codes", async (t) => {
  const directory = await fixtureDirectory(t);
  const contextFile = path.join(directory, "context.json");
  const capabilityFile = path.join(directory, "capability.json");
  await writeFile(contextFile, JSON.stringify({
    environment: "test",
    mode: "guided",
    production_authorized: false,
    allowed_capabilities: [],
    approvals: [],
    credentials: [],
  }));
  await writeFile(capabilityFile, JSON.stringify({ name: "create-record", state_changing: true }));
  assert.equal(run("permission", contextFile, capabilityFile).status, 2);
  assert.equal(run("not-a-command").status, 64);
  assert.equal(run("run-id", "../unsafe").status, 1);
});

test("CLI installs a provider layout directly into a target directory", async (t) => {
  const directory = await fixtureDirectory(t);
  const result = run("install", "claude", "--target", directory);
  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.installed_to, directory);
  assert.equal(output.provider, "claude");
  const skill = await readFile(path.join(directory, ".claude/skills/holistic-qa-plan/SKILL.md"), "utf8");
  assert.match(skill, /name: holistic-qa-plan/);
  assert.equal(run("install", "gemini", "--target", directory).status, 1);
  assert.equal(run("install", "codex", "--target", directory, "extra").status, 64);
});
