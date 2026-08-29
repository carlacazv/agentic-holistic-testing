import path from "node:path";
import { lstat, readFile, realpath } from "node:fs/promises";
import { checksum } from "./checksum.mjs";
import { validateArtifactIndex, validateReturnEnvelope } from "./validation.mjs";

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

export function resolveArtifactPath(runDirectory, relativePath) {
  if (
    typeof relativePath !== "string" ||
    relativePath.length === 0 ||
    path.isAbsolute(relativePath) ||
    relativePath.includes("\\") ||
    relativePath.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw new TypeError("Artifact path must be a normalized relative POSIX path");
  }
  const root = path.resolve(runDirectory);
  const candidate = path.resolve(root, ...relativePath.split("/"));
  if (!isInside(root, candidate)) throw new TypeError("Artifact path escapes the run directory");
  return candidate;
}

export async function validateArtifactFiles(runDirectory, index) {
  const errors = [...validateArtifactIndex(index)];
  if (errors.length > 0) return { valid: false, errors };

  const root = await realpath(runDirectory).catch(() => null);
  if (root === null) return { valid: false, errors: [`${runDirectory}: run directory does not exist`] };

  for (const entry of index.artifacts) {
    let candidate;
    try {
      candidate = resolveArtifactPath(root, entry.path);
    } catch (error) {
      errors.push(`${entry.path}: ${error.message}`);
      continue;
    }

    let details;
    try {
      details = await lstat(candidate);
    } catch {
      errors.push(`${entry.path}: artifact is missing`);
      continue;
    }
    if (details.isSymbolicLink() || !details.isFile()) {
      errors.push(`${entry.path}: artifact must be a regular file, not a symbolic link`);
      continue;
    }
    const actualPath = await realpath(candidate);
    if (!isInside(root, actualPath)) {
      errors.push(`${entry.path}: resolved artifact escapes the run directory`);
      continue;
    }
    const bytes = await readFile(actualPath);
    if (bytes.length !== entry.bytes) errors.push(`${entry.path}: byte size mismatch`);
    if (checksum(bytes) !== entry.checksum) errors.push(`${entry.path}: checksum mismatch`);
  }

  return { valid: errors.length === 0, errors };
}

export async function validateRunDirectory(runDirectory) {
  const errors = [];
  let index;
  let envelope;
  try {
    index = JSON.parse(await readFile(path.join(runDirectory, "artifact-index.json"), "utf8"));
  } catch (error) {
    errors.push(`artifact-index.json: ${error.message}`);
  }
  try {
    envelope = JSON.parse(await readFile(path.join(runDirectory, "return-envelope.json"), "utf8"));
  } catch (error) {
    errors.push(`return-envelope.json: ${error.message}`);
  }
  if (!index || !envelope) return { valid: false, errors };

  errors.push(...validateReturnEnvelope(envelope));
  const artifactResult = await validateArtifactFiles(runDirectory, index);
  errors.push(...artifactResult.errors);
  if (index.run_id !== envelope.run_id) errors.push("Control files have different run IDs");
  if (JSON.stringify(index.artifacts) !== JSON.stringify(envelope.artifacts)) {
    errors.push("Control files have different artifact entries");
  }
  return { valid: errors.length === 0, errors };
}
