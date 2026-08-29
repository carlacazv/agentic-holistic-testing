import path from "node:path";
import { randomBytes } from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import { canonicalJson } from "./canonical.mjs";
import { checksum } from "./checksum.mjs";
import { createRunId, validateRunId } from "./ids.mjs";
import { redactText } from "./redaction.mjs";
import { resolveArtifactPath, validateArtifactFiles } from "./artifacts.mjs";
import { SCHEMA_VERSION } from "./constants.mjs";
import { validateArtifactEntry, validateReturnEnvelope } from "./validation.mjs";

const CONTROL_FILES = new Set(["artifact-index.json", "return-envelope.json"]);

async function ensureDirectoryTree(root, segments) {
  let current = root;
  for (const segment of segments) {
    current = path.join(current, segment);
    try {
      const details = await lstat(current);
      if (details.isSymbolicLink() || !details.isDirectory()) {
        throw new TypeError(`${current} must be a real directory`);
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await mkdir(current);
    }
  }
  return realpath(current);
}

async function assertNoSymlinkPath(root, candidate) {
  const relative = path.relative(root, candidate);
  let current = root;
  for (const segment of relative.split(path.sep).slice(0, -1)) {
    current = path.join(current, segment);
    try {
      const details = await lstat(current);
      if (details.isSymbolicLink()) throw new TypeError(`${current} is a symbolic link`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}

async function atomicWrite(filePath, value) {
  const temporary = `${filePath}.tmp-${randomBytes(6).toString("hex")}`;
  await writeFile(temporary, value, { flag: "wx" });
  await rename(temporary, filePath);
}

function sortedUnique(values) {
  return [...new Set(values ?? [])].sort();
}

export class RunStore {
  constructor({ workspace = process.cwd(), runId } = {}) {
    this.workspace = path.resolve(workspace);
    this.runId = runId === undefined ? createRunId() : validateRunId(runId);
    this.artifacts = new Map();
    this.initialized = false;
  }

  async initialize() {
    await mkdir(this.workspace, { recursive: true });
    const workspaceRoot = await realpath(this.workspace);
    this.durableDirectory = await ensureDirectoryTree(workspaceRoot, ["qa", "runs", this.runId]);
    this.rawDirectory = await ensureDirectoryTree(workspaceRoot, ["test-results", this.runId]);
    this.initialized = true;
    return {
      run_id: this.runId,
      durable_directory: this.durableDirectory,
      raw_directory: this.rawDirectory,
    };
  }

  assertInitialized() {
    if (!this.initialized) throw new Error("RunStore must be initialized first");
  }

  durablePath(relativePath) {
    this.assertInitialized();
    if (CONTROL_FILES.has(relativePath)) {
      throw new TypeError(`${relativePath} is reserved for run control data`);
    }
    return resolveArtifactPath(this.durableDirectory, relativePath);
  }

  rawPath(relativePath) {
    this.assertInitialized();
    return resolveArtifactPath(this.rawDirectory, relativePath);
  }

  async writeRaw(relativePath, value) {
    const target = this.rawPath(relativePath);
    await assertNoSymlinkPath(this.rawDirectory, target);
    await mkdir(path.dirname(target), { recursive: true });
    await assertNoSymlinkPath(this.rawDirectory, target);
    await atomicWrite(target, Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8"));
    return target;
  }

  async writeArtifact(relativePath, value, metadata) {
    if (this.artifacts.has(relativePath)) throw new TypeError(`Artifact already registered: ${relativePath}`);
    const target = this.durablePath(relativePath);
    await assertNoSymlinkPath(this.durableDirectory, target);
    await mkdir(path.dirname(target), { recursive: true });
    await assertNoSymlinkPath(this.durableDirectory, target);
    const bytes = Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8");
    await atomicWrite(target, bytes);
    return this.registerExisting(relativePath, metadata);
  }

  async registerExisting(relativePath, { type, mediaType, generationStatus = "generated" }) {
    if (this.artifacts.has(relativePath)) throw new TypeError(`Artifact already registered: ${relativePath}`);
    const target = this.durablePath(relativePath);
    const details = await lstat(target);
    if (details.isSymbolicLink() || !details.isFile()) {
      throw new TypeError("Artifact must be a regular file, not a symbolic link");
    }
    const actual = await realpath(target);
    if (path.relative(this.durableDirectory, actual).startsWith("..")) {
      throw new TypeError("Artifact resolves outside the durable run directory");
    }
    const bytes = await readFile(actual);
    const entry = {
      type,
      path: relativePath,
      media_type: mediaType,
      checksum: checksum(bytes),
      generation_status: generationStatus,
      bytes: bytes.length,
    };
    const errors = validateArtifactEntry(entry);
    if (errors.length > 0) throw new TypeError(errors.join("; "));
    this.artifacts.set(relativePath, entry);
    return entry;
  }

  async promoteText(rawRelativePath, durableRelativePath, metadata, redactionOptions = {}) {
    const source = this.rawPath(rawRelativePath);
    const details = await lstat(source);
    if (details.isSymbolicLink() || !details.isFile()) {
      throw new TypeError("Raw evidence must be a regular text file");
    }
    const redacted = redactText(await readFile(source, "utf8"), redactionOptions);
    const artifact = await this.writeArtifact(durableRelativePath, redacted.text, metadata);
    return { artifact, redaction: { replacements: redacted.replacements, types: redacted.types } };
  }

  async finalize({
    skill,
    status: runStatus,
    inputs = [],
    metrics = {},
    gaps = [],
    residualRisks = [],
    approvals = [],
    errors = [],
    nextActions = [],
    requiredArtifacts = [],
  }) {
    this.assertInitialized();
    const artifacts = [...this.artifacts.values()].sort((left, right) => left.path.localeCompare(right.path));
    const index = { schema_version: SCHEMA_VERSION, run_id: this.runId, artifacts };
    const fileValidation = await validateArtifactFiles(this.durableDirectory, index);
    if (!fileValidation.valid) throw new TypeError(fileValidation.errors.join("; "));

    const missing = requiredArtifacts.filter(
      (requiredPath) => !this.artifacts.has(requiredPath) || this.artifacts.get(requiredPath).generation_status !== "generated",
    );
    if (missing.length > 0) {
      throw new TypeError(`Required artifacts are missing or incomplete: ${missing.join(", ")}`);
    }

    const envelope = {
      schema_version: SCHEMA_VERSION,
      run_id: this.runId,
      skill,
      status: runStatus,
      inputs: sortedUnique(inputs),
      artifacts,
      metrics,
      gaps: sortedUnique(gaps),
      residual_risks: sortedUnique(residualRisks),
      approvals: sortedUnique(approvals),
      errors,
      next_actions: sortedUnique(nextActions),
    };
    const envelopeErrors = validateReturnEnvelope(envelope);
    if (envelopeErrors.length > 0) throw new TypeError(envelopeErrors.join("; "));

    await atomicWrite(
      path.join(this.durableDirectory, "artifact-index.json"),
      `${canonicalJson(index)}\n`,
    );
    await atomicWrite(
      path.join(this.durableDirectory, "return-envelope.json"),
      `${canonicalJson(envelope)}\n`,
    );
    return { index, envelope };
  }
}

export async function pathByteSize(filePath) {
  return (await stat(filePath)).size;
}
