import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalJson } from "../src/core/canonical.mjs";
import { checksum } from "../src/core/checksum.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function normalizeBody(value) {
  return `${value.replaceAll("\r\n", "\n").trim()}\n`;
}

function yamlString(value) {
  return JSON.stringify(value);
}

async function loadManifest() {
  const manifest = JSON.parse(await readFile(path.join(root, "skills", "manifest.json"), "utf8"));
  if (manifest.schema_version !== 1 || !Array.isArray(manifest.skills)) {
    throw new TypeError("skills/manifest.json is invalid");
  }
  const identifiers = new Set();
  for (const skill of manifest.skills) {
    if (!/^[a-z][a-z0-9-]{1,47}$/.test(skill.id) || typeof skill.description !== "string") {
      throw new TypeError("Every declared skill requires a valid id and description");
    }
    if (identifiers.has(skill.id)) throw new TypeError(`Duplicate skill id: ${skill.id}`);
    identifiers.add(skill.id);
  }
  return manifest;
}

async function buildLayout(outputRoot, { provider, skillsDirectory, frontmatterName }) {
  const sourceManifest = await loadManifest();
  const generated = [];
  for (const skill of sourceManifest.skills) {
    const sourcePath = path.join(root, "skills", "holistic-qa", skill.id, "instructions.md");
    const body = normalizeBody(await readFile(sourcePath, "utf8"));
    const bodyChecksum = checksum(body);
    const directory = path.join(outputRoot, ...skillsDirectory, `holistic-qa-${skill.id}`);
    await mkdir(directory, { recursive: true });
    const document = [
      "---",
      `name: ${frontmatterName(skill.id)}`,
      `description: ${yamlString(skill.description)}`,
      "metadata:",
      `  provider: ${provider}`,
      `  source_checksum: ${bodyChecksum}`,
      "---",
      "",
      body,
    ].join("\n");
    await writeFile(path.join(directory, "SKILL.md"), document, "utf8");
    generated.push({ id: skill.id, source_checksum: bodyChecksum });
  }
  const adapterManifest = {
    schema_version: 1,
    provider,
    skills: generated.sort((left, right) => left.id.localeCompare(right.id)),
  };
  await mkdir(outputRoot, { recursive: true });
  await writeFile(
    path.join(outputRoot, ".holistic-qa-manifest.json"),
    `${canonicalJson(adapterManifest)}\n`,
    "utf8",
  );
  return adapterManifest;
}

async function buildCodex(outputRoot) {
  return buildLayout(outputRoot, {
    provider: "codex",
    skillsDirectory: [".agents", "skills"],
    frontmatterName: (id) => `holistic-qa:${id}`,
  });
}

async function buildClaude(outputRoot) {
  return buildLayout(outputRoot, {
    provider: "claude",
    skillsDirectory: [".claude", "skills"],
    frontmatterName: (id) => `holistic-qa-${id}`,
  });
}

const PROVIDERS = Object.freeze({ codex: buildCodex, claude: buildClaude });

export async function buildAdapter(provider, outputRoot) {
  const builder = PROVIDERS[provider];
  if (!builder) throw new TypeError(`Unsupported v1 provider: ${provider}`);
  return builder(outputRoot);
}

async function run() {
  const [provider, option] = process.argv.slice(2);
  if (!provider) throw new TypeError("Provider is required");
  const check = option === "--check";
  const outputRoot = check
    ? await mkdtemp(path.join(os.tmpdir(), `holistic-qa-${provider}-`))
    : path.join(root, "dist", provider);
  try {
    const result = await buildAdapter(provider, outputRoot);
    process.stdout.write(`${canonicalJson({ output: outputRoot, ...result })}\n`);
  } finally {
    if (check) await rm(outputRoot, { recursive: true, force: true });
  }
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
