import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PINNED_PLAYWRIGHT_MCP, SCHEMA_IDS } from "../src/core/constants.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaDirectory = path.join(root, "schemas", "v1");
const files = (await readdir(schemaDirectory)).filter((file) => file.endsWith(".schema.json")).sort();
const identifiers = new Set();

for (const file of files) {
  const schema = JSON.parse(await readFile(path.join(schemaDirectory, file), "utf8"));
  if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") {
    throw new TypeError(`${file}: unsupported JSON Schema dialect`);
  }
  if (typeof schema.$id !== "string" || identifiers.has(schema.$id)) {
    throw new TypeError(`${file}: missing or duplicate $id`);
  }
  identifiers.add(schema.$id);
}

for (const identifier of Object.values(SCHEMA_IDS)) {
  if (!identifiers.has(identifier)) throw new TypeError(`Missing schema: ${identifier}`);
}

const integration = JSON.parse(
  await readFile(path.join(root, "integrations", "playwright-mcp.json"), "utf8"),
);
if (
  integration.package !== PINNED_PLAYWRIGHT_MCP.package ||
  integration.version !== PINNED_PLAYWRIGHT_MCP.version ||
  !/^\d+\.\d+\.\d+$/.test(integration.version)
) {
  throw new TypeError("Playwright MCP integration must use the exact checked-in version");
}

process.stdout.write(`Validated ${files.length} schemas and the pinned browser integration.\n`);
