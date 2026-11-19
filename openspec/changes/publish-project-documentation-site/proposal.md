## Why

The repository's architecture, benchmark evidence, and evolution are distributed across README sections, pull requests, workflow runs, and benchmark source. A reader can see the implementation but cannot quickly distinguish the verified baseline from aspiration or understand what the current benchmark does not prove.

The project needs a public, auditable narrative that makes quality evidence legible without weakening it into unqualified success claims.

## What Changes

- Add a generated static documentation site containing the verified baseline, benchmark results and limitations, operating model, skills, project history, and roadmap.
- Store the site's factual content in one versioned data module and publish a machine-readable JSON snapshot from the same source.
- Add deterministic build and validation commands that reconcile benchmark counts, check project-history coverage, validate local assets, and parse client JavaScript.
- Add a least-privilege GitHub Pages workflow that validates pull requests and deploys only from `main` or an authorized manual run.
- Link the published evidence ledger from the repository README.

## Capabilities

### New Capabilities

- `project-documentation-site`: A public, evidence-linked record of project benchmarks, architecture, evolution, and remaining gaps.

### Modified Capabilities

None.

## Impact

Affects the new `site/` source, documentation build and validation scripts, the package validation pipeline, GitHub Pages workflow, README, and OpenSpec artifacts. It adds no runtime dependency and does not change any QA skill contract.
