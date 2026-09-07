import test from "node:test";
import assert from "node:assert/strict";
import { markdownTable } from "../src/core/markdown.mjs";

test("markdown tables escape pipes, flatten newlines, and preserve empty cells", () => {
  assert.equal(markdownTable(["Value", "Empty"], [["a|b\nc", ""]]), "| Value | Empty |\n| --- | --- |\n| a\\|b c |  |\n");
});
