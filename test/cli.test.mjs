import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { RunStore } from "../src/core/run-store.mjs";

const cli = path.resolve("src/cli.mjs");

async function fixtureDirectory(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-cli-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

function run(...arguments_) {
  return spawnSync(process.execPath, [cli, ...arguments_], { encoding: "utf8" });
}

function runIn(directory, ...arguments_) {
  return spawnSync(process.execPath, [cli, ...arguments_], { cwd: directory, encoding: "utf8" });
}

async function completedRun(workspace, runId, skill) {
  const store = new RunStore({ workspace, runId });
  await store.initialize();
  await store.writeArtifact("evidence.md", "verified\n", { type: "test.evidence", mediaType: "text/markdown" });
  await store.finalize({ skill, status: "completed", requiredArtifacts: ["evidence.md"] });
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

test("CLI starts orchestrated and explicit skill cycles", async (t) => {
  const orchestrated = run("cycle-init", "Assess", "checkout", "quality");
  assert.equal(orchestrated.status, 0);
  assert.equal(JSON.parse(orchestrated.stdout).invocation, "orchestrated");

  const explicit = run("cycle-init", "Audit", "accessibility", "--skill", "accessibility");
  const state = JSON.parse(explicit.stdout);
  assert.deepEqual(state.selected_skills, ["accessibility"]);
  const directory = await fixtureDirectory(t);
  const stateFile = path.join(directory, "cycle.json");
  await writeFile(stateFile, JSON.stringify(state));
  assert.equal(JSON.parse(run("cycle-next", stateFile).stdout).skill, "accessibility");
});

test("CLI persists, resumes, completes, and summarizes a cycle", async (t) => {
  const directory = await fixtureDirectory(t);
  const stateFile = path.join(directory, "nested", "cycle.json");
  const start = runIn(directory, "cycle-start", "Assess", "checkout", "--output", stateFile, "--skill", "accessibility");
  assert.equal(start.status, 0);
  assert.equal(JSON.parse(runIn(directory, "cycle-resume", stateFile).stdout).next.skill, "accessibility");
  await completedRun(directory, "run-a11y-0001", "accessibility");
  assert.equal(runIn(directory, "cycle-complete", stateFile, "accessibility", "run-a11y-0001").status, 0);
  const summary = JSON.parse(runIn(directory, "cycle-summary", stateFile).stdout);
  assert.equal(summary.status, "completed");
  assert.equal(summary.completed, 1);
});

test("CLI refuses to complete a cycle with missing, invalid, or wrong-skill runs", async (t) => {
  const directory = await fixtureDirectory(t);
  const stateFile = path.join(directory, "cycle.json");
  assert.equal(runIn(directory, "cycle-start", "Assess", "checkout", "--output", stateFile, "--skill", "accessibility").status, 0);

  assert.equal(runIn(directory, "cycle-complete", stateFile, "accessibility", "missing-run").status, 1);
  assert.equal(runIn(directory, "cycle-complete", stateFile, "accessibility", "run-missing-0001").status, 1);
  await completedRun(directory, "run-plan-0001", "plan");
  const mismatch = runIn(directory, "cycle-complete", stateFile, "accessibility", "run-plan-0001");
  assert.equal(mismatch.status, 1);
  assert.equal(JSON.parse(mismatch.stdout).error, "run_mismatch");
  assert.deepEqual(JSON.parse(await readFile(stateFile, "utf8")).completed_skills, []);
});

test("doctor diagnoses a consuming workspace", async (t) => {
  const directory = await fixtureDirectory(t);
  await writeFile(path.join(directory, "package.json"), "{}\n");
  const result = run("doctor", directory);
  assert.equal(result.status, 0);
  assert.ok(["pass", "warn"].includes(JSON.parse(result.stdout).status));
});
