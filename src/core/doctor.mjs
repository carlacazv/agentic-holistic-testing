import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

async function exists(target) {
  try { await access(target, constants.R_OK); return true; } catch { return false; }
}

export async function diagnoseWorkspace(workspace = process.cwd()) {
  const root = path.resolve(workspace);
  const checks = [];
  const major = Number.parseInt(process.versions.node.split(".")[0], 10);
  checks.push({ id: "node", status: major >= 22 ? "pass" : "fail", detail: process.versions.node });
  const packagePath = path.join(root, "package.json");
  checks.push({ id: "package", status: await exists(packagePath) ? "pass" : "warn", detail: packagePath });
  if (await exists(packagePath)) {
    try { JSON.parse(await readFile(packagePath, "utf8")); } catch { checks.push({ id: "package-json", status: "fail", detail: "invalid JSON" }); }
  }
  const git = spawnSync("git", ["-C", root, "rev-parse", "--show-toplevel"], { encoding: "utf8" });
  checks.push({ id: "git", status: git.status === 0 ? "pass" : "warn", detail: git.status === 0 ? git.stdout.trim() : "not a Git worktree" });
  const providers = [];
  if (await exists(path.join(root, ".agents", ".holistic-qa-manifest.json"))) providers.push("codex");
  if (await exists(path.join(root, ".claude", ".holistic-qa-manifest.json"))) providers.push("claude");
  checks.push({ id: "adapter", status: providers.length > 0 ? "pass" : "warn", detail: providers.length > 0 ? providers.join(",") : "not installed" });
  const status = checks.some((check) => check.status === "fail") ? "fail" : checks.some((check) => check.status === "warn") ? "warn" : "pass";
  return { workspace: root, status, checks };
}
