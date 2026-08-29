## Context

Automation strategy emits the only eligible candidate set. The foundation resolves browser mechanisms and permissions. This slice needs real Playwright verification without coupling the runtime to Playwright.

## Goals / Non-Goals

**Goals:** approval-gated generation rules, static implementation validation, actual local browser/API fixtures, and three-run repeatability evidence.

**Non-Goals:** generating unapproved tests, modifying application source, accepting flaky retries, or installing browser MCP automatically.

## Decisions

Use exact `@playwright/test` 1.62.1 as a dev dependency and an isolated Node HTTP fixture app. Fixture Playwright configuration enables HTML, JSON, JUnit, trace, screenshot, and video outputs and uses installed Chrome locally with bundled Chromium fallback. A provider-neutral validator checks manifest approval, `.spec.ts` paths, forbidden fixed waits, accessible locators, and web-first assertions before artifact acceptance.

Run the fixture suite with `--repeat-each=3 --retries=0`; any failure makes validation fail. Retries are disabled because they would hide instability. Application changes remain outside the skill unless separately approved.

## Risks / Trade-offs

- [Static source checks cannot prove semantic quality] → Combine them with real fixture execution and require target-project verification evidence.
- [Chrome availability differs by environment] → Allow an explicit executable path and bundled Chromium fallback; browser absence becomes blocked.
- [Artifact reporters increase output volume] → Keep raw outputs under ignored `test-results/` and only promote redacted durable summaries.

## Migration Plan

Install from the verified public registry, add fixture/config/tests and validators, repeat execution, update adapter/docs, then archive.
