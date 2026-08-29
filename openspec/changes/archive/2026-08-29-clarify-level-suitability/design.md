## Context

Both readings of `component_suitable` were defensible, and the runtime only implements one of them.

**Feasibility.** The flag says the behavior *can* be exercised at that level, and a separate judgment decides whether the lower level gives equivalent confidence. Under this reading the ladder needs an override field so a row can declare a level above its flags with a rationale, and the component signal survives into implementation.

**Equivalence.** The flag says the level *gives equivalent confidence*. A widget whose risk only appears in the assembled UI is therefore not component suitable, the ladder needs no override, and a component-suitable case is covered at component level rather than in Playwright.

The equivalence reading is what the runtime implements and what this change adopts. It keeps the recommendation derivable from the flags alone, with no second judgment field and no override to police, and it makes `validateAutomationStrategy` the enforcement point that already exists: a row marked suitable at a level and recommended above it is rejected.

The cost is real and accepted: the strategy no longer carries any component-boundary signal into implementation. The component-object decision moves entirely to the implementer, who chooses it from repetition of a widget across the approved browser specs - which is the information actually available at that point, since the strategy rows that reach this skill are all API or browser E2E by construction.
