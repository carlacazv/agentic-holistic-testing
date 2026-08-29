import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export function sha256(value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8");
  return createHash("sha256").update(bytes).digest("hex");
}

export function checksum(value) {
  return `sha256:${sha256(value)}`;
}

export async function checksumFile(filePath) {
  return checksum(await readFile(filePath));
}
