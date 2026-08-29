import { randomBytes } from "node:crypto";
import { canonicalJson } from "./canonical.mjs";
import { sha256 } from "./checksum.mjs";

const RUN_ID_PATTERN = /^run-[a-z0-9][a-z0-9-]{5,63}$/;
const PREFIX_PATTERN = /^[a-z][a-z0-9-]{1,19}$/;

export function validateRunId(runId) {
  if (typeof runId !== "string" || !RUN_ID_PATTERN.test(runId)) {
    throw new TypeError(
      "Run ID must match ^run-[a-z0-9][a-z0-9-]{5,63}$",
    );
  }
  return runId;
}

export function createRunId({ now = new Date(), random = randomBytes(5) } = {}) {
  if (!(now instanceof Date) || Number.isNaN(now.valueOf())) {
    throw new TypeError("now must be a valid Date");
  }
  const stamp = now.toISOString().replace(/[-:.]/g, "").toLowerCase();
  const entropy = Buffer.from(random).toString("hex");
  return validateRunId(`run-${stamp}-${entropy}`);
}

export function stableId(prefix, canonicalInput) {
  if (typeof prefix !== "string" || !PREFIX_PATTERN.test(prefix)) {
    throw new TypeError("ID prefix must be lowercase kebab-case with 2-20 characters");
  }
  return `${prefix}-${sha256(canonicalJson(canonicalInput)).slice(0, 16)}`;
}
