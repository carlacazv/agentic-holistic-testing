import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.resolve("test-results/performance-fixture");
await mkdir(outputDirectory, { recursive: true });
const server = spawn(process.execPath, ["test/fixtures/web-app/server.mjs"], {
  env: { ...process.env, FIXTURE_PORT: "4173" },
  stdio: ["ignore", "pipe", "inherit"],
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.stdout.on("data", (chunk) => {
    if (chunk.toString().includes("Fixture listening")) resolve();
  });
  server.once("exit", (code) => reject(new Error(`Fixture server exited before readiness with ${code}`)));
});

try {
  const lighthousePath = path.resolve("node_modules/lighthouse/cli/index.js");
  const lighthouseOutput = path.join(outputDirectory, "lighthouse.json");
  const lighthouse = spawn(process.execPath, [
    lighthousePath,
    "http://127.0.0.1:4173",
    "--quiet",
    "--only-categories=performance",
    "--output=json",
    `--output-path=${lighthouseOutput}`,
    "--chrome-path=/usr/bin/google-chrome",
    "--chrome-flags=--headless --no-sandbox --disable-gpu",
  ], { stdio: "inherit" });
  const lighthouseCode = await new Promise((resolve, reject) => {
    lighthouse.once("error", reject);
    lighthouse.once("exit", resolve);
  });
  if (lighthouseCode !== 0) throw new Error(`Lighthouse exited with ${lighthouseCode}`);
  const report = JSON.parse(await readFile(lighthouseOutput, "utf8"));
  if (!Number.isFinite(report.categories?.performance?.score)) throw new Error("Lighthouse report lacks performance score");

  const samples = [];
  for (let index = 0; index < 10; index += 1) {
    const started = performance.now();
    const response = await fetch("http://127.0.0.1:4173/api/items");
    const elapsed = performance.now() - started;
    if (!response.ok) throw new Error(`Fixture API returned ${response.status}`);
    samples.push(Number(elapsed.toFixed(3)));
  }
  await writeFile(
    path.join(outputDirectory, "api-timings.json"),
    `${JSON.stringify({ endpoint: "/api/items", samples_ms: samples, errors: [] })}\n`,
    "utf8",
  );
  process.stdout.write(`Performance fixture captured Lighthouse score ${report.categories.performance.score} and ${samples.length} API samples.\n`);
} finally {
  server.kill("SIGTERM");
  await new Promise((resolve) => server.once("exit", resolve));
}
