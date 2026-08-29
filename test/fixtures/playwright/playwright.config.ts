import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

const systemChrome = "/usr/bin/google-chrome";
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH ?? (existsSync(systemChrome) ? systemChrome : undefined);

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: "../../../test-results/playwright-fixture/artifacts",
  reporter: [
    ["list"],
    ["html", { outputFolder: "../../../test-results/playwright-fixture/html", open: "never" }],
    ["json", { outputFile: "../../../test-results/playwright-fixture/results.json" }],
    ["junit", { outputFile: "../../../test-results/playwright-fixture/results.xml" }]
  ],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    launchOptions: executablePath ? { executablePath } : {}
  },
  webServer: {
    command: "node ../web-app/server.mjs",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 10_000
  }
});
