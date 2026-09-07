#!/usr/bin/env node
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildAdapter } from "../scripts/build-adapter.mjs";
import { canonicalJson } from "./core/canonical.mjs";
import { validateArtifactFiles, validateRunDirectory } from "./core/artifacts.mjs";
import { resolveBrowserCapability } from "./core/browser.mjs";
import { createRunId, validateRunId } from "./core/ids.mjs";
import { evaluateCapability } from "./core/permissions.mjs";
import { validateDocument } from "./core/validation.mjs";
import { diagnoseWorkspace } from "./core/doctor.mjs";
import { verificationFromPlaywrightReport } from "./stages/implement-playwright.mjs";
import { completeCycleStep, createCycleState, nextCycleStep, summarizeCycle, validateCycleState } from "./workflows/cycle.mjs";

async function readJson(filePath) {
  return JSON.parse(await readFile(path.resolve(filePath), "utf8"));
}

function output(value) {
  process.stdout.write(`${canonicalJson(value)}\n`);
}

async function writeJson(filePath, value) {
  const target = path.resolve(filePath);
  const temporary = `${target}.${process.pid}.tmp`;
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(temporary, `${canonicalJson(value)}\n`, "utf8");
  await rename(temporary, target);
  return target;
}

function usage() {
  return {
    commands: [
      "install <codex|claude> [--target <directory>]",
      "validate <schema-name-or-id> <document.json>",
      "validate-artifacts <run-directory> <artifact-index.json>",
      "validate-run <run-directory>",
      "permission <execution-context.json> <capability.json>",
      "browser <availability.json>",
      "run-id [candidate]",
      "cycle-init <goal> [--skill <skill>]",
      "cycle-next <cycle-state.json>",
      "cycle-start <goal> --output <cycle-state.json> [--skill <skill>]",
      "cycle-resume <cycle-state.json>",
      "cycle-complete <cycle-state.json> <skill> <run-id>",
      "cycle-summary <cycle-state.json>",
      "doctor [workspace]",
      "import-playwright <manifest.json> <playwright-report.json> <executed-command>",
    ],
  };
}

async function main([command, ...args]) {
  if (!command || command === "help" || command === "--help") {
    output(usage());
    return 0;
  }
  if (command === "install" && args.length >= 1) {
    const [provider, ...rest] = args;
    let target = process.cwd();
    if (rest.length === 2 && rest[0] === "--target") {
      target = rest[1];
    } else if (rest.length !== 0) {
      output({ error: "invalid_arguments", usage: usage() });
      return 64;
    }
    const resolvedTarget = path.resolve(target);
    const result = await buildAdapter(provider, resolvedTarget);
    output({ installed_to: resolvedTarget, ...result });
    return 0;
  }
  if (command === "validate" && args.length === 2) {
    const result = validateDocument(args[0], await readJson(args[1]));
    output(result);
    return result.valid ? 0 : 1;
  }
  if (command === "validate-artifacts" && args.length === 2) {
    const result = await validateArtifactFiles(path.resolve(args[0]), await readJson(args[1]));
    output(result);
    return result.valid ? 0 : 1;
  }
  if (command === "validate-run" && args.length === 1) {
    const result = await validateRunDirectory(path.resolve(args[0]));
    output(result);
    return result.valid ? 0 : 1;
  }
  if (command === "permission" && args.length === 2) {
    const result = evaluateCapability(await readJson(args[0]), await readJson(args[1]));
    output(result);
    return result.allowed ? 0 : 2;
  }
  if (command === "browser" && args.length === 1) {
    const result = resolveBrowserCapability(await readJson(args[0]));
    output(result);
    return result.status === "resolved" ? 0 : 2;
  }
  if (command === "run-id" && args.length <= 1) {
    const runId = args.length === 0 ? createRunId() : validateRunId(args[0]);
    output({ run_id: runId });
    return 0;
  }
  if (command === "cycle-init" && args.length >= 1) {
    const skillIndex = args.indexOf("--skill");
    const explicitSkill = skillIndex === -1 ? null : args[skillIndex + 1];
    const goalParts = skillIndex === -1 ? args : args.slice(0, skillIndex);
    output(createCycleState({ goal: goalParts.join(" "), explicitSkill }));
    return 0;
  }
  if (command === "cycle-next" && args.length === 1) {
    const state = await readJson(args[0]);
    const validation = validateCycleState(state);
    if (!validation.valid) { output(validation); return 1; }
    output(nextCycleStep(state));
    return 0;
  }
  if (command === "cycle-start") {
    const outputIndex = args.indexOf("--output");
    const skillIndex = args.indexOf("--skill");
    if (outputIndex < 1 || !args[outputIndex + 1]) { output({ error: "invalid_arguments", usage: usage() }); return 64; }
    const optionIndexes = [outputIndex, skillIndex].filter((index) => index >= 0);
    const goalEnd = Math.min(...optionIndexes);
    const state = createCycleState({ goal: args.slice(0, goalEnd).join(" "), explicitSkill: skillIndex === -1 ? null : args[skillIndex + 1] });
    output({ state_file: await writeJson(args[outputIndex + 1], state), state });
    return 0;
  }
  if (command === "cycle-resume" && args.length === 1) {
    const state = await readJson(args[0]);
    output({ summary: summarizeCycle(state), next: nextCycleStep(state) });
    return 0;
  }
  if (command === "cycle-complete" && args.length === 3) {
    const runId = validateRunId(args[2]);
    const runDirectory = path.resolve("qa", "runs", runId);
    const runValidation = await validateRunDirectory(runDirectory);
    if (!runValidation.valid) {
      output({ error: "invalid_run", run_id: runId, errors: runValidation.errors });
      return 1;
    }
    const envelope = await readJson(path.join(runDirectory, "return-envelope.json"));
    if (envelope.run_id !== runId || envelope.skill !== args[1]) {
      output({
        error: "run_mismatch",
        run_id: runId,
        expected_skill: args[1],
        actual_skill: envelope.skill ?? null,
      });
      return 1;
    }
    const state = completeCycleStep(await readJson(args[0]), { skill: args[1], runId });
    output({ state_file: await writeJson(args[0], state), state, next: nextCycleStep(state) });
    return 0;
  }
  if (command === "cycle-summary" && args.length === 1) { output(summarizeCycle(await readJson(args[0]))); return 0; }
  if (command === "doctor" && args.length <= 1) { const result = await diagnoseWorkspace(args[0]); output(result); return result.status === "fail" ? 1 : 0; }
  if (command === "import-playwright" && args.length === 3) {
    const manifest = await readJson(args[0]);
    manifest.verification_results = verificationFromPlaywrightReport(manifest, await readJson(args[1]), args[2]);
    output(manifest);
    return 0;
  }
  output({ error: "invalid_arguments", usage: usage() });
  return 64;
}

try {
  process.exitCode = await main(process.argv.slice(2));
} catch (error) {
  output({ error: "command_failed", message: error.message });
  process.exitCode = 1;
}
