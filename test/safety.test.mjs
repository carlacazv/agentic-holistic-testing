import test from "node:test";
import assert from "node:assert/strict";
import { resolveBrowserCapability } from "../src/core/browser.mjs";
import { PINNED_PLAYWRIGHT_MCP } from "../src/core/constants.mjs";
import { evaluateCapability } from "../src/core/permissions.mjs";
import { redactText } from "../src/core/redaction.mjs";
import { validateExecutionContext } from "../src/core/validation.mjs";

function context(overrides = {}) {
  return {
    environment: "test",
    mode: "guided",
    production_authorized: false,
    allowed_capabilities: [],
    approvals: [],
    credentials: [{ provider: "environment", key: "QA_USER" }],
    ...overrides,
  };
}

test("redaction covers configured and structured credentials", () => {
  const keyHeader = ["-----BEGIN TEST PRIVATE", "KEY-----"].join(" ");
  const keyFooter = ["-----END TEST PRIVATE", "KEY-----"].join(" ");
  const source = [
    "Authorization: Bearer header-token",
    "Cookie: session=cookie-value",
    "https://example.test/?access_token=query-token&safe=yes",
    '{"api_key":"json-token"}',
    `${keyHeader}\nkey-body\n${keyFooter}`,
    "configured-value",
  ].join("\n");
  const result = redactText(source, { secrets: ["configured-value"] });
  for (const secret of ["header-token", "cookie-value", "query-token", "json-token", "key-body", "configured-value"]) {
    assert.equal(result.text.includes(secret), false);
  }
  assert.equal(result.replacements, 6);
  assert.deepEqual(result.types, [
    "authorization",
    "configured-secret",
    "cookie",
    "json-credential",
    "private-key",
    "url-credential",
  ]);
});

test("credential references cannot contain values", () => {
  const unsafe = context({ credentials: [{ provider: "environment", key: "QA_USER", value: "secret" }] });
  assert.match(validateExecutionContext(unsafe).join("\n"), /additional property/);
});

test("guided and autonomous gates deny unauthorized capabilities", () => {
  assert.equal(
    evaluateCapability(context(), { name: "create-record", state_changing: true }).code,
    "approval_required",
  );
  assert.equal(
    evaluateCapability(context({ mode: "autonomous" }), { name: "read-page", state_changing: false }).code,
    "capability_not_pre_authorized",
  );
  assert.equal(
    evaluateCapability(
      context({ mode: "autonomous", allowed_capabilities: ["read-page"] }),
      { name: "read-page", state_changing: false },
    ).allowed,
    true,
  );
});

test("production is explicit and always read-only", () => {
  const disabled = context({ environment: "production" });
  assert.equal(evaluateCapability(disabled, { name: "read-page", state_changing: false }).code, "production_disabled");

  const authorized = context({
    environment: "production",
    production_authorized: true,
    allowed_capabilities: ["read-page", "create-record"],
  });
  assert.equal(evaluateCapability(authorized, { name: "create-record", state_changing: true }).allowed, false);
  assert.equal(evaluateCapability(authorized, { name: "read-page", state_changing: false }).allowed, true);
});

test("browser resolution enforces the pin and records fallbacks", () => {
  assert.equal(
    resolveBrowserCapability({
      mcp: { available: true, ...PINNED_PLAYWRIGHT_MCP },
      browser_tool: { available: true },
      cli: { available: true },
    }).provider,
    "playwright-mcp",
  );
  const fallback = resolveBrowserCapability({
    mcp: { available: false },
    browser_tool: { available: true },
    cli: { available: true },
  });
  assert.equal(fallback.provider, "provider-browser-tool");
  assert.ok(fallback.gaps.length > 0);
  assert.equal(resolveBrowserCapability({}).status, "blocked");
});
