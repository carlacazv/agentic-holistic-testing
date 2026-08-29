import { PINNED_PLAYWRIGHT_MCP } from "./constants.mjs";

export function resolveBrowserCapability(availability = {}) {
  const gaps = [];
  const mcp = availability.mcp ?? {};
  if (mcp.available === true) {
    if (mcp.package === PINNED_PLAYWRIGHT_MCP.package && mcp.version === PINNED_PLAYWRIGHT_MCP.version) {
      return { status: "resolved", provider: "playwright-mcp", gaps };
    }
    gaps.push(
      `Playwright MCP must be pinned to ${PINNED_PLAYWRIGHT_MCP.package}@${PINNED_PLAYWRIGHT_MCP.version}`,
    );
  } else {
    gaps.push("Pinned Playwright MCP is unavailable");
  }

  if (availability.browser_tool?.available === true) {
    return { status: "resolved", provider: "provider-browser-tool", gaps };
  }
  gaps.push("Provider browser tool is unavailable");

  if (availability.cli?.available === true) {
    return { status: "resolved", provider: "playwright-cli", gaps };
  }
  gaps.push("Playwright CLI is unavailable");
  return { status: "blocked", provider: null, gaps };
}
