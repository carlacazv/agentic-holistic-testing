# Project Documentation Site Specification

## ADDED Requirements

### Requirement: Auditable project narrative
The repository SHALL publish a static documentation site that identifies its exact verified baseline and explains the current benchmarks, operating model, capability surface, project history, and roadmap. Every historical milestone and benchmark SHALL link to its implementation or execution evidence.

#### Scenario: Reader traces a claim
- **WHEN** a reader encounters a benchmark result or project milestone
- **THEN** the site provides the baseline context and a direct link to the associated pull request, workflow run, subject repository, or commit

### Requirement: Bounded benchmark claims
Each benchmark SHALL state its executed cases, repetitions, retries, controls, and known limitations when those dimensions apply. The site MUST NOT represent a passing benchmark as proof that the product or agent is defect-free.

#### Scenario: Passing consumer benchmark has uncovered areas
- **WHEN** every Planning Poker execution passes
- **THEN** the site still identifies unmeasured agent-generation, reproducibility, concurrency, accessibility, performance, reconnection, and host-transfer dimensions

### Requirement: Single versioned data source
Visible project facts and the published machine-readable JSON snapshot SHALL be generated from one versioned data module. Validation SHALL reject mismatched generated data, unreconciled benchmark totals, missing benchmark cases, incomplete pull-request history, broken local assets, invalid client JavaScript, and placeholder or local-only links.

#### Scenario: Benchmark math drifts
- **WHEN** the passing execution count does not equal cases multiplied by repetitions
- **THEN** documentation validation fails before a Pages artifact is uploaded

### Requirement: Accessible static delivery
The primary documentation SHALL be present in generated HTML without requiring client-side rendering. The page SHALL provide semantic landmarks, one primary heading, a keyboard skip link, visible focus treatment, responsive layouts, and reduced-motion handling.

#### Scenario: Client JavaScript is unavailable
- **WHEN** the browser does not execute the progressive-enhancement script
- **THEN** all benchmark, architecture, history, and roadmap content remains readable and navigable

### Requirement: Least-privilege Pages deployment
Pull requests SHALL build and validate the site without deployment permission. Only pushes to `main` or authorized manual workflow runs MAY upload and deploy the GitHub Pages artifact. The deploy job SHALL receive only the contents, Pages, and identity-token permissions required by GitHub Pages.

#### Scenario: Documentation changes in a pull request
- **WHEN** a pull request changes the site, build, validator, package command, or Pages workflow
- **THEN** GitHub Actions builds and validates the documentation without deploying it
