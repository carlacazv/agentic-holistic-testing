## Context

The runtime already separates model proposals from deterministic completion checks, but the Playwright stage used regular expressions over source and modeled only three file kinds. The Planning Poker correction demonstrates the missing layers: merged fixtures, fixture injection, lifecycle-owned browser contexts, typed factories and boundary data, enums, environment configuration, tags, annotations, and cleanup.

## Goals / Non-Goals

**Goals:**
- Make architectural drift a validation failure before artifacts are finalized.
- Keep architecture and behavior presentation explicit and versioned.
- Preserve existing repository conventions when they are structurally equivalent.
- Use the corrected consumer implementation as a regression benchmark.
- Keep failed product assertions as valid QA evidence.

**Non-Goals:**
- Prove that generated assertions are semantically sufficient; human or model review still owns test intent.
- Force one naming convention onto a mature repository that already has equivalent layering.
- Change which approved automation-strategy candidates are eligible.
- Modify application source without its existing separate approval.

## Decisions

- **AST-backed rules**: Parse TypeScript with the pinned `@typescript-eslint/typescript-estree` dependency. Regex remains only for narrow unsafe idioms where lexical matching is the contract. This prevents comments and strings from satisfying imports, calls, annotations, classes, or fixture construction.
- **Two profiles**: `agentic-playwright` is the default canonical layout. `repository-native` keeps equivalent native paths but requires a rationale. Essential controls apply to both profiles.
- **Central fixture boundary**: Specs import `test` and `expect` from one declared fixture module. The default profile builds it with `mergeTests`; page/component objects and additional browser contexts are instantiated only in fixture layers.
- **Configurable narrative style**: New suites prefer Given/When/Then, while Given/When/Should and a repository-native narrative remain explicit options. Assertions must remain in named `test.step` calls regardless of style.
- **Manifest-complete architecture**: Every generated support file is declared with its kind. Specs declare expected static test count, state mutation, cleanup, and referenced UI abstractions. Configuration pins locale, timezone, exact Playwright version, evidence reporters/artifacts, and lint/type-check/Playwright commands.
- **Expanded evidence checksum**: Verification is invalidated by changes to architecture, candidate mapping, configuration, CI, file path/kind, or source—not source text alone.
- **Golden consumer benchmark**: Unit validation loads the merged Planning Poker files directly, while the existing external-repository workflow runs their real browser suite. Contract-related paths trigger both quality and consumer verification.

## Risks / Trade-offs

- [AST parsing adds install size and parsing cost] → Pin one parser version and parse each manifest source once per validation; the test suite measures the full path.
- [Strict defaults could fight an established repository] → Allow the reasoned `repository-native` profile while retaining essential safeguards.
- [Static test counting cannot fully expand arbitrary dynamic generation] → Require `expected_tests` per spec and reconcile the exact total with collected runner evidence; AST calls form a lower bound.
- [A golden benchmark could silently age] → Trigger it on every implementation skill, validator, schema, test, or dependency change.

## Migration Plan

Update manifests to declare architecture and every support file, move default-profile files to canonical paths, centralize fixture imports, inject POM/COM instances, add test metadata and cleanup declarations, pin configuration and CI commands, then regenerate runner evidence because the expanded source checksum intentionally invalidates prior evidence.
