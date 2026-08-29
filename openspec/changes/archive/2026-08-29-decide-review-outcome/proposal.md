## Why

Using the skill showed the cost of writing first and asking never. A plan review emits six artifacts - an improved bundle, two CSVs, two JSON files and a markdown gap list - before the reader has seen a single finding, and it emits them whether or not anyone wanted the plan changed. The findings are what the reader came for, and they arrive as files to open rather than as points to read. A review that turns out to need no action still leaves a full run behind.

The skill also offers one outcome. A reader who wants the omissions covered without the existing plan being rewritten has no way to say so: applying is the only path, and applying may change or remove records.

## What Changes

- Report findings in the conversation first, and create no run at all when the reader acts on none of them.
- Declare the outcome as a mode: `apply` rewrites the bundle, `complement` may only add to it. Every record and link present before a complement is still present and unchanged after it.
- Collapse the five evidence artifacts into one `review.md` carrying the mode, both bundle checksums, findings, modifications, before/after coverage, and remaining gaps, so a run holds the improved plan and one readable document.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `review-plan-skill`: adds the declared outcome that decides whether removal is legal, and reduces the durable result to the improved plan plus one review document.

## Impact

Affects `src/stages/review-plan.mjs`, `schemas/v1/review-plan.schema.json`, `test/review-plan.test.mjs`, the review-plan instructions, and the README skill table. `mode` becomes required: a review that does not declare one is rejected rather than defaulted, because the mode decides whether a record may leave the plan. The findings and modifications stop being CSV; nothing downstream consumed them, since `automation-strategy` consumes the plan bundle rather than the review.
