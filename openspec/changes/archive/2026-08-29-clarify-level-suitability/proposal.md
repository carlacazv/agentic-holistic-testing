## Why

The two skills disagree about what a suitability flag means, and the disagreement describes a state the pipeline cannot produce. `recommendAutomationLevel` returns `component` for any row marked `component_suitable`, so such a row can never be recommended at browser E2E and never reaches `approvedPlaywrightCandidates`. The implement-playwright instructions nonetheless tell an agent to read `component_suitable` as the strongest signal for a component object "when such a row is nonetheless approved at browser E2E". No row ever is, so the guidance is unreachable and the reader is left looking for a signal that cannot arrive.

## What Changes

- State that a level's suitability declares confidence equivalent to the levels above it, not mere feasibility, so the recommendation is the lowest level marked suitable and a risk visible only higher up is declared by withholding the lower level's suitability.
- Choose component objects from repetition of a widget across the approved browser specs rather than from a strategy row, since a case covered at component level never becomes a Playwright candidate.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `automation-strategy-skill`: the suitability flags carry the equivalence judgment that the recommendation ladder already assumed.
- `implement-playwright-skill`: the component-object decision comes from the approved specs and the surfaces they traverse.

## Impact

Affects `skills/holistic-qa/automation-strategy/instructions.md` and `skills/holistic-qa/implement-playwright/instructions.md`. No runtime behavior changes: `recommendAutomationLevel` already implements the ladder this makes explicit, and `validateAutomationStrategy` already rejects a row recommended above its flags.
