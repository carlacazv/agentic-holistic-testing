import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import projectData from "../site/project-data.mjs";
import { renderSite } from "../site/render.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(repositoryRoot, ".site-dist");

if (path.basename(outputDirectory) !== ".site-dist") {
  throw new Error(`Refusing to replace unexpected output directory: ${outputDirectory}`);
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(path.join(outputDirectory, "assets"), { recursive: true });
await mkdir(path.join(outputDirectory, "data"), { recursive: true });

await Promise.all([
  writeFile(path.join(outputDirectory, "index.html"), renderSite(projectData), "utf8"),
  writeFile(path.join(outputDirectory, ".nojekyll"), "", "utf8"),
  writeFile(
    path.join(outputDirectory, "data", "project.json"),
    `${JSON.stringify(projectData, null, 2)}\n`,
    "utf8",
  ),
  cp(path.join(repositoryRoot, "site", "assets", "site.css"), path.join(outputDirectory, "assets", "site.css")),
  cp(path.join(repositoryRoot, "site", "assets", "site.js"), path.join(outputDirectory, "assets", "site.js")),
]);

console.log(`Documentation site built at ${path.relative(repositoryRoot, outputDirectory)}/`);
