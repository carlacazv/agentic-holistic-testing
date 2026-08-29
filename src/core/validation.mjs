import {
  ENVIRONMENTS,
  EXECUTION_MODES,
  GENERATION_STATUSES,
  RUN_STATUSES,
  SCHEMA_IDS,
  SCHEMA_VERSION,
} from "./constants.mjs";

const RUN_ID_PATTERN = /^run-[a-z0-9][a-z0-9-]{5,63}$/;
const SKILL_PATTERN = /^[a-z][a-z0-9-]{1,63}$/;
const CHECKSUM_PATTERN = /^sha256:[a-f0-9]{64}$/;
const TYPE_PATTERN = /^[a-z][a-z0-9._-]{1,63}$/;
const ERROR_CODE_PATTERN = /^[a-z][a-z0-9_]{1,63}$/;
const MEDIA_TYPE_PATTERN = /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function checkObject(value, path, required, allowed, errors) {
  if (!isObject(value)) {
    errors.push(`${path}: expected object`);
    return false;
  }
  for (const key of required) {
    if (!(key in value)) errors.push(`${path}/${key}: required`);
  }
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) errors.push(`${path}/${key}: additional property is not allowed`);
  }
  return true;
}

function checkStringArray(value, path, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${path}: expected array`);
    return;
  }
  value.forEach((entry, index) => {
    if (typeof entry !== "string") errors.push(`${path}/${index}: expected string`);
  });
  if (new Set(value).size !== value.length) errors.push(`${path}: duplicate values are not allowed`);
}

export function validateArtifactEntry(value, path = "/artifact") {
  const errors = [];
  const fields = ["type", "path", "media_type", "checksum", "generation_status", "bytes"];
  if (!checkObject(value, path, fields, fields, errors)) return errors;
  if (typeof value.type !== "string" || !TYPE_PATTERN.test(value.type)) {
    errors.push(`${path}/type: invalid artifact type`);
  }
  if (typeof value.path !== "string" || value.path.length === 0) {
    errors.push(`${path}/path: expected non-empty string`);
  } else if (
    value.path.startsWith("/") ||
    value.path.includes("\\") ||
    value.path.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    errors.push(`${path}/path: expected a normalized relative POSIX path`);
  }
  if (typeof value.media_type !== "string" || !MEDIA_TYPE_PATTERN.test(value.media_type)) {
    errors.push(`${path}/media_type: invalid media type`);
  }
  if (typeof value.checksum !== "string" || !CHECKSUM_PATTERN.test(value.checksum)) {
    errors.push(`${path}/checksum: expected lowercase SHA-256 checksum`);
  }
  if (!GENERATION_STATUSES.includes(value.generation_status)) {
    errors.push(`${path}/generation_status: unknown generation status`);
  }
  if (!Number.isInteger(value.bytes) || value.bytes < 0) {
    errors.push(`${path}/bytes: expected non-negative integer`);
  }
  return errors;
}

export function validateError(value, path = "/error") {
  const errors = [];
  const fields = ["code", "message", "recoverable", "unblocker"];
  if (!checkObject(value, path, fields, fields, errors)) return errors;
  if (typeof value.code !== "string" || !ERROR_CODE_PATTERN.test(value.code)) {
    errors.push(`${path}/code: invalid error code`);
  }
  if (typeof value.message !== "string" || value.message.length === 0) {
    errors.push(`${path}/message: expected non-empty string`);
  }
  if (typeof value.recoverable !== "boolean") {
    errors.push(`${path}/recoverable: expected boolean`);
  }
  if (value.unblocker !== null && typeof value.unblocker !== "string") {
    errors.push(`${path}/unblocker: expected string or null`);
  }
  if (value.recoverable === true && (typeof value.unblocker !== "string" || value.unblocker.length === 0)) {
    errors.push(`${path}/unblocker: recoverable errors require an unblocker`);
  }
  return errors;
}

export function validateArtifactIndex(value) {
  const errors = [];
  const fields = ["schema_version", "run_id", "artifacts"];
  if (!checkObject(value, "", fields, fields, errors)) return errors;
  if (value.schema_version !== SCHEMA_VERSION) errors.push("/schema_version: expected 1");
  if (typeof value.run_id !== "string" || !RUN_ID_PATTERN.test(value.run_id)) {
    errors.push("/run_id: invalid run ID");
  }
  if (!Array.isArray(value.artifacts)) {
    errors.push("/artifacts: expected array");
  } else {
    value.artifacts.forEach((entry, index) => {
      errors.push(...validateArtifactEntry(entry, `/artifacts/${index}`));
    });
    const paths = value.artifacts.map((entry) => entry?.path).filter(Boolean);
    if (new Set(paths).size !== paths.length) errors.push("/artifacts: duplicate paths are not allowed");
  }
  return errors;
}

export function validateReturnEnvelope(value) {
  const errors = [];
  const fields = [
    "schema_version",
    "run_id",
    "skill",
    "status",
    "inputs",
    "artifacts",
    "metrics",
    "gaps",
    "residual_risks",
    "approvals",
    "errors",
    "next_actions",
  ];
  if (!checkObject(value, "", fields, fields, errors)) return errors;
  if (value.schema_version !== SCHEMA_VERSION) errors.push("/schema_version: expected 1");
  if (typeof value.run_id !== "string" || !RUN_ID_PATTERN.test(value.run_id)) {
    errors.push("/run_id: invalid run ID");
  }
  if (typeof value.skill !== "string" || !SKILL_PATTERN.test(value.skill)) {
    errors.push("/skill: invalid skill name");
  }
  if (!RUN_STATUSES.includes(value.status)) errors.push("/status: unknown status");
  for (const name of ["inputs", "gaps", "residual_risks", "approvals", "next_actions"]) {
    checkStringArray(value[name], `/${name}`, errors);
  }
  if (!isObject(value.metrics)) errors.push("/metrics: expected object");
  if (!Array.isArray(value.artifacts)) {
    errors.push("/artifacts: expected array");
  } else {
    value.artifacts.forEach((entry, index) => {
      errors.push(...validateArtifactEntry(entry, `/artifacts/${index}`));
    });
    const paths = value.artifacts.map((entry) => entry?.path).filter(Boolean);
    if (new Set(paths).size !== paths.length) errors.push("/artifacts: duplicate paths are not allowed");
  }
  if (!Array.isArray(value.errors)) {
    errors.push("/errors: expected array");
  } else {
    value.errors.forEach((entry, index) => errors.push(...validateError(entry, `/errors/${index}`)));
  }

  if (value.status === "completed") {
    if (value.gaps?.length > 0) errors.push("/gaps: completed runs cannot have coverage gaps");
    if (value.errors?.length > 0) errors.push("/errors: completed runs cannot have errors");
    if (value.artifacts?.some((entry) => entry.generation_status !== "generated")) {
      errors.push("/artifacts: completed runs require generated artifacts");
    }
  }
  if (value.status === "partial" && value.gaps?.length === 0) {
    errors.push("/gaps: partial runs require at least one gap");
  }
  if (["blocked", "failed"].includes(value.status) && value.errors?.length === 0) {
    errors.push("/errors: blocked and failed runs require at least one error");
  }
  if (value.status === "blocked" && !value.errors?.some((entry) => entry.recoverable === true)) {
    errors.push("/errors: blocked runs require a recoverable error");
  }
  return errors;
}

export function validateExecutionContext(value) {
  const errors = [];
  const fields = [
    "environment",
    "mode",
    "production_authorized",
    "allowed_capabilities",
    "approvals",
    "credentials",
  ];
  if (!checkObject(value, "", fields, fields, errors)) return errors;
  if (!ENVIRONMENTS.includes(value.environment)) errors.push("/environment: unknown environment");
  if (!EXECUTION_MODES.includes(value.mode)) errors.push("/mode: unknown execution mode");
  if (typeof value.production_authorized !== "boolean") {
    errors.push("/production_authorized: expected boolean");
  }
  checkStringArray(value.allowed_capabilities, "/allowed_capabilities", errors);
  checkStringArray(value.approvals, "/approvals", errors);
  if (!Array.isArray(value.credentials)) {
    errors.push("/credentials: expected array");
  } else {
    value.credentials.forEach((credential, index) => {
      const path = `/credentials/${index}`;
      if (!checkObject(credential, path, ["provider", "key"], ["provider", "key"], errors)) return;
      if (typeof credential.provider !== "string" || credential.provider.length === 0) {
        errors.push(`${path}/provider: expected non-empty string`);
      }
      if (typeof credential.key !== "string" || credential.key.length === 0) {
        errors.push(`${path}/key: expected non-empty string`);
      }
    });
  }
  return errors;
}

const validators = new Map([
  ["artifact-index", validateArtifactIndex],
  [SCHEMA_IDS["artifact-index"], validateArtifactIndex],
  ["execution-context", validateExecutionContext],
  [SCHEMA_IDS["execution-context"], validateExecutionContext],
  ["return-envelope", validateReturnEnvelope],
  [SCHEMA_IDS["return-envelope"], validateReturnEnvelope],
]);

export function validateDocument(schema, value) {
  const validator = validators.get(schema);
  if (!validator) {
    throw new TypeError(`Unknown repository-owned schema: ${schema}`);
  }
  const errors = validator(value);
  return { valid: errors.length === 0, errors };
}
