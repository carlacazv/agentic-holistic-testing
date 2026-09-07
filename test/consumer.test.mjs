import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { buildAdapter } from "../scripts/build-adapter.mjs";

const cli = path.resolve("src/cli.mjs");

test("a clean consumer project can install, diagnose, and resume one explicit skill", async (t) => {
  const consumer = await mkdtemp(path.join(os.tmpdir(), "holistic-qa-consumer-"));
  t.after(() => rm(consumer, { recursive: true, force: true }));
  await writeFile(path.join(consumer, "package.json"), '{"name":"consumer","private":true}\n');
  assert.equal(spawnSync("git", ["init", "-q", consumer]).status, 0);
  await buildAdapter("codex", consumer);

  const run = (...args) => spawnSync(process.execPath, [cli, ...args], { cwd: consumer, encoding: "utf8" });
  const doctor = JSON.parse(run("doctor", ".").stdout);
  assert.equal(doctor.status, "pass");
  assert.match(await readFile(path.join(consumer, ".agents/skills/holistic-qa-accessibility/SKILL.md"), "utf8"), /name: holistic-qa-accessibility/);

  const stateFile = path.join(consumer, "cycle.json");
  assert.equal(run("cycle-start", "Audit accessibility", "--output", stateFile, "--skill", "accessibility").status, 0);
  const resumed = JSON.parse(run("cycle-resume", stateFile).stdout);
  assert.equal(resumed.next.skill, "accessibility");
  assert.deepEqual(resumed.summary.run_ids, []);
});
