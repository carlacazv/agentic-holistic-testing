export const SCHEMA_VERSION = 1;

export const RUN_STATUSES = Object.freeze([
  "completed",
  "partial",
  "blocked",
  "failed",
]);

export const ENVIRONMENTS = Object.freeze([
  "local",
  "development",
  "test",
  "staging",
  "production",
]);

export const EXECUTION_MODES = Object.freeze(["guided", "autonomous"]);
export const GENERATION_STATUSES = Object.freeze(["generated", "partial"]);

export const SCHEMA_IDS = Object.freeze({
  "artifact-entry": "urn:holistic-qa:schema:v1:artifact-entry",
  "artifact-index": "urn:holistic-qa:schema:v1:artifact-index",
  error: "urn:holistic-qa:schema:v1:error",
  "execution-context": "urn:holistic-qa:schema:v1:execution-context",
  "playwright-implementation": "urn:holistic-qa:schema:v1:playwright-implementation",
  "return-envelope": "urn:holistic-qa:schema:v1:return-envelope",
});

export const PINNED_PLAYWRIGHT_MCP = Object.freeze({
  package: "@playwright/mcp",
  version: "0.0.79",
});
