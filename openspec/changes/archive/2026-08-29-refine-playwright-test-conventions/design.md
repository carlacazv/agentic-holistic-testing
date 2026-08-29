## Context

`validatePlaywrightImplementation` already gates approval, fixed waits, accessible locators, web-first assertions, reporters, and verification counts by inspecting each manifest file's `source` string. The conventions this change adds are enforced the same way, against the same manifest. See `proposal.md` for motivation and `specs/implement-playwright-skill/spec.md` for the required behavior.

## Goals / Non-Goals

**Goals:** make the structure, flake, and abstraction rules mechanically checkable; keep every legitimate exception visible as a finding rather than as a weaker rule; keep the repository's own Playwright fixtures as the worked example of the convention.

**Non-Goals:** parsing TypeScript into an AST, judging whether a chosen page object is well factored, or enforcing a directory layout for objects.

## Decisions

Enforcement stays regex-based over `file.source`. An AST parse would catch more, but it would add a TypeScript parser dependency to a runtime that deliberately has none, and the rules that matter here are lexical: a title prefix, a prohibited call, a positional selector. The cost is accepted false negatives inside strings and comments, not false positives that would block valid work.

Behavior structure is checked through describe and step titles rather than nesting depth, because a spec may legitimately need one or three levels while the Given/When/Should vocabulary stays constant.

The UI abstraction is declared per file rather than inferred. Inference would have to guess whether two specs share a surface; a declaration with a rationale records the reasoning where a reviewer can challenge it. Rejecting `inline` above one approved browser candidate encodes the reuse threshold without demanding abstraction for a single flow.

Accessible-locator resolution widens to the spec plus every declared object, because requiring `getBy*` in the spec would make a page object fail the very rule it exists to serve. Web-first assertions stay scoped to the spec, which is what keeps assertions out of objects.

Findings carry the exceptions: category `locator` for a structural or positional selector, category `exclusion` for a skipped test. This reuses the mechanism already established for structural locators instead of adding a second escape hatch.

## Risks / Trade-offs

- [Regex checks can be evaded by unusual formatting] → The rules are a quality floor over a manifest the skill itself generates, not a security boundary; the reviewable artifacts remain the source and the findings.
- [A prohibited pattern appearing in a string or comment produces a false positive] → Each rejection names the file and the rule, so a false positive is diagnosable and answerable with a finding.
- [Requiring an object above one browser candidate can force early abstraction] → The threshold matches the point where a locator is reused across tests, and the rationale field records the judgment when inline is still correct.

## Migration Plan

Extend the validator, update the skill instructions, rewrite the Playwright fixtures into the convention with a real page object, extend the unit tests to cover each new rejection and its finding-based exception, then run full validation twice.
