import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import projectData from "../site/project-data.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(repositoryRoot, ".site-dist");
const indexPath = path.join(outputDirectory, "index.html");
const cssPath = path.join(outputDirectory, "assets", "site.css");
const javascriptPath = path.join(outputDirectory, "assets", "site.js");
const dataPath = path.join(outputDirectory, "data", "project.json");

await Promise.all([
  access(indexPath),
  access(cssPath),
  access(javascriptPath),
  access(dataPath),
  access(path.join(outputDirectory, ".nojekyll")),
]);

const [html, css, generatedData] = await Promise.all([
  readFile(indexPath, "utf8"),
  readFile(cssPath, "utf8"),
  readFile(dataPath, "utf8").then(JSON.parse),
]);

assert.deepEqual(generatedData, projectData, "published JSON must match the rendered source data");
assert.match(html, /<html lang="en">/, "the document language must be declared");
assert.equal((html.match(/<h1\b/g) ?? []).length, 1, "the page must contain exactly one h1");
assert.match(html, /<main id="main-content">/, "the page must expose a main landmark");
assert.match(html, /class="skip-link"/, "the page must provide a keyboard skip link");
assert.doesNotMatch(html, /href="#"/, "placeholder links are not allowed");
assert.doesNotMatch(html, /localhost|127\.0\.0\.1/, "published content must not reference a local server");
assert.match(css, /prefers-reduced-motion/, "motion must respect the user's reduced-motion preference");

const planningPoker = projectData.benchmarks.find((benchmark) => benchmark.id === "planning-poker");
assert.ok(planningPoker, "the Planning Poker benchmark must be documented");
assert.equal(planningPoker.execution.cases, planningPoker.cases.length);
assert.equal(
  planningPoker.execution.passed,
  planningPoker.execution.cases * planningPoker.execution.repetitions,
  "the passing execution count must reconcile with cases and repetitions",
);
assert.equal(planningPoker.execution.retries, 0, "the published baseline must not accept retries");

const documentedPullRequests = projectData.history.flatMap((milestone) => milestone.pullRequests);
assert.deepEqual(documentedPullRequests, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
assert.equal(projectData.skills.length, 9, "the current capability surface must list nine skills");

for (const benchmark of projectData.benchmarks) {
  assert.match(html, new RegExp(`id="${benchmark.id}"`));
  assert.match(html, new RegExp(benchmark.runUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

for (const milestone of projectData.history) {
  assert.ok(html.includes(milestone.title), `missing project milestone: ${milestone.title}`);
}

for (const testCase of planningPoker.cases) {
  assert.ok(html.includes(testCase.id), `missing benchmark case: ${testCase.id}`);
}

const localReferences = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((reference) => !reference.startsWith("#") && !/^(?:https?:|mailto:)/.test(reference))
  .map((reference) => reference.split(/[?#]/, 1)[0]);

for (const reference of new Set(localReferences)) {
  const resolved = path.resolve(outputDirectory, reference);
  assert.ok(
    resolved.startsWith(`${outputDirectory}${path.sep}`),
    `local site reference escapes the output directory: ${reference}`,
  );
  await access(resolved);
}

const syntaxCheck = spawnSync(process.execPath, ["--check", javascriptPath], {
  encoding: "utf8",
});
assert.equal(
  syntaxCheck.status,
  0,
  `published JavaScript must parse successfully: ${syntaxCheck.stderr}`,
);

console.log(
  `Documentation site valid: ${projectData.history.length} milestones, ${projectData.benchmarks.length} benchmarks, ${localReferences.length} local asset references.`,
);
