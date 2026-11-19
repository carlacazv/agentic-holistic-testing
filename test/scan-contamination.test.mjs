import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const scanner = fileURLToPath(new URL("../scripts/scan-contamination.mjs", import.meta.url));
const secret = ["ghp", "_", "a".repeat(24)].join("");

test("contamination scan handles tracked directory, external, and dangling links without following targets", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "qa-scan-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const repo = join(root, "repo");
  await mkdir(join(repo, ".agents", "skills"), { recursive: true });
  execFileSync("git", ["init", "-q", repo]);
  await writeFile(join(repo, ".agents", "skills", "guide.md"), "Shared instructions\n");
  await writeFile(join(root, "private.txt"), secret);
  await symlink(".agents/skills", join(repo, "skills"));
  await symlink("../private.txt", join(repo, "external"));
  await symlink("missing", join(repo, "dangling"));
  execFileSync("git", ["add", "."], { cwd: repo });

  const result = spawnSync(process.execPath, [scanner], { cwd: repo, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Scanned 4 versioned files; no contamination found/);

  // Real source files still pass through the credential detector.
  await writeFile(join(repo, "leak.txt"), secret);
  const contaminated = spawnSync(process.execPath, [scanner], { cwd: repo, encoding: "utf8" });
  assert.equal(contaminated.status, 1);
  assert.match(contaminated.stderr, /leak.txt: contains a credential-like token/);
});
