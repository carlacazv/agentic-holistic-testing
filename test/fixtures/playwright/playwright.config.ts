import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
import { appConfig } from "./config/app";

const systemChrome = "/usr/bin/google-chrome";
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH ?? (existsSync(systemChrome) ? systemChrome : undefined);

export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.spec.ts",
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
    baseURL: appConfig.baseURL,
    locale: appConfig.locale,
    timezoneId: appConfig.timezoneId,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    launchOptions: executablePath ? { executablePath } : {}
  },
  webServer: {
    command: "node ../web-app/server.mjs",
    url: appConfig.baseURL,
    reuseExistingServer: false,
    timeout: 10_000
  }
});
