## Context

Holistic QA is explicitly evidence-first. Publishing benchmark results therefore requires more than a landing page: every number needs a stable snapshot, direct implementation or workflow evidence, and a visible statement of scope and limitations. The site also needs to work under the repository subpath used by GitHub Pages.

## Goals / Non-Goals

**Goals:**
- Make the verified baseline and project trajectory understandable to a reader who has not followed the pull requests.
- Preserve one versioned source for visible facts and machine-readable benchmark data.
- Publish a fast, accessible, dependency-free static site under the repository's GitHub Pages URL.
- Validate documentation in pull requests and deploy with least-privilege permissions after merge.

**Non-Goals:**
- Present benchmark results as proof that the subject or agent has no defects.
- Fetch mutable GitHub data in the browser or require a token at runtime.
- Replace the repository README, OpenSpec, workflow logs, or raw benchmark evidence.
- Score agent discovery and code generation before such a benchmark exists.

## Decisions

- **Generated static HTML**: `site/project-data.mjs` is rendered by a Node script into `.site-dist/`. This keeps the published page crawlable and usable without client-side rendering while avoiding a framework and dependency update.
- **One factual source**: The same data module produces the visible page and `data/project.json`. Validation reconciles cases, repetitions, pass totals, pull request coverage, skills, links, and generated JSON.
- **Snapshot semantics**: Results are labeled with the baseline date and commit rather than presented as live telemetry. Direct links lead to the implementation PRs, workflow runs, subject, and merge commit.
- **Visible negative space**: Each consumer benchmark states what it proves and what remains outside scope. Known reproducibility and evaluation gaps are roadmap inputs, not hidden caveats.
- **Progressive enhancement**: The generated HTML contains all documentation. Client JavaScript only adds navigation state and clipboard feedback.
- **Pages boundary**: Pull requests build and validate without deployment credentials. Pushes to `main` and manual runs build once, upload the root-level Pages artifact, and deploy through the protected `github-pages` environment.

## Risks / Trade-offs

- [Snapshot facts can become stale] → Display the exact baseline date and commit, keep the data in one file, and run documentation validation in the repository quality contract.
- [Narrative claims can drift from evidence] → Require source links and mechanically reconcile the benchmark execution math and project-history PR range.
- [A static site cannot show live status] → Prefer auditable snapshots; future work may generate new snapshot data in CI without adding runtime API access.
- [GitHub Pages deployment can gain excessive permissions] → Grant `pages: write` and `id-token: write` only to the deploy job; validation keeps `contents: read` only.

## Migration Plan

Merge the site source and workflow to `main`. The already-enabled GitHub Actions publishing source will run the Pages workflow, upload `.site-dist/`, and create or update the `github-pages` deployment. Future benchmark changes update the versioned snapshot and are validated before publication.
