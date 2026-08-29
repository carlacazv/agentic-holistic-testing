import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { canonicalJson } from "../src/core/canonical.mjs";
import { checksum } from "../src/core/checksum.mjs";
import { parseCsv, serializeCsv } from "../src/core/csv.mjs";
import { createRunId, stableId, validateRunId } from "../src/core/ids.mjs";
import { validateDocument } from "../src/core/validation.mjs";

test("canonical JSON and content IDs are deterministic", () => {
  assert.equal(canonicalJson({ z: 1, a: { y: 2, x: 3 } }), '{"a":{"x":3,"y":2},"z":1}');
  assert.equal(stableId("case", { b: 2, a: 1 }), stableId("case", { a: 1, b: 2 }));
  assert.match(checksum("evidence"), /^sha256:[a-f0-9]{64}$/);
  assert.throws(() => canonicalJson({ value: Number.NaN }), /non-finite/);
});

test("run IDs are safe and generated IDs are sortable", () => {
  const runId = createRunId({
    now: new Date("2026-08-29T13:45:00.123Z"),
    random: Buffer.from("0011223344", "hex"),
  });
  assert.equal(runId, "run-20260829t134500123z-0011223344");
  assert.equal(validateRunId(runId), runId);
  for (const unsafe of ["../run-safe", "run-UPPER", "run-space here", "run-$(command)"]) {
    assert.throws(() => validateRunId(unsafe), /Run ID/);
  }
});

test("CSV preserves RFC 4180 edge values", () => {
  const columns = ["id", "summary", "notes"];
  const records = [
    { id: "case-1", summary: "commas, quotes \"work\"", notes: "line 1\r\nline 2" },
    { id: "case-2", summary: "Unicode ✓", notes: "" },
  ];
  const encoded = serializeCsv(columns, records);
  assert.match(encoded, /\r\n$/);
  assert.deepEqual(parseCsv(encoded, { columns }), records);
  assert.throws(() => parseCsv("a,b\r\n1\r\n"), /row 2/);
  assert.throws(() => parseCsv("a,a\r\n1,2\r\n"), /unique/);
  assert.throws(() => serializeCsv(["a"], [{ a: "1", b: "2" }]), /undeclared/);
});

test("return envelope validation reports all detectable failures", () => {
  const result = validateDocument("return-envelope", {
    schema_version: 1,
    run_id: "unsafe",
    skill: "Plan",
    status: "done",
    inputs: [],
    artifacts: [],
    metrics: [],
    gaps: [],
    residual_risks: [],
    approvals: [],
    errors: [],
    next_actions: [],
    unexpected: true,
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 5);
  assert.throws(() => validateDocument("https://unknown.invalid/schema", {}), /Unknown/);
});

test("versioned envelope fixture satisfies the executable contract", async () => {
  const fixture = JSON.parse(await readFile("test/fixtures/return-envelope.valid.json", "utf8"));
  assert.deepEqual(validateDocument("return-envelope", fixture), { valid: true, errors: [] });
});
