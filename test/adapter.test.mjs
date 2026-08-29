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
  assert.deepEqual(result.skills, []);
  const written = JSON.parse(await readFile(path.join(directory, ".holistic-qa-manifest.json"), "utf8"));
  assert.deepEqual(written, result);
  await assert.rejects(buildAdapter("claude", directory), /Unsupported v1 provider/);
});
