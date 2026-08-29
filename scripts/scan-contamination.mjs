import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const tracked = execFileSync(
  "git",
  ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);
const forbiddenWords = [
  String.fromCharCode(109, 101, 100, 112, 114, 101, 118),
  String.fromCharCode(99, 111, 100, 101, 97, 114, 116, 105, 102, 97, 99, 116),
];
const findings = [];

for (const file of tracked) {
  const buffer = await readFile(file);
  if (buffer.includes(0)) continue;
  const text = buffer.toString("utf8");
  const lowered = text.toLowerCase();
  for (const word of forbiddenWords) {
    if (lowered.includes(word)) findings.push(`${file}: contains a prohibited organization reference`);
  }
  if (/registry\s*=\s*https?:\/\/(?!registry\.npmjs\.org\/?\s*$)/gim.test(text)) {
    findings.push(`${file}: configures a non-public package registry`);
  }
  if (/\b(?:gh[opusr]_[a-z0-9]{20,}|akia[a-z0-9]{16})\b/i.test(text)) {
    findings.push(`${file}: contains a credential-like token`);
  }
  if (/-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/.test(text)) {
    findings.push(`${file}: contains private-key material`);
  }
}

if (findings.length > 0) {
  process.stderr.write(`${findings.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Scanned ${tracked.length} versioned files; no contamination found.\n`);
}
