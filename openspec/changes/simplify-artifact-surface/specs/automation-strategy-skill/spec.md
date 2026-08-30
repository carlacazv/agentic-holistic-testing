## MODIFIED Requirements

### Requirement: Durable strategy return
The skill SHALL return every assessed row as one canonical strategy document, rendered by one summary document carrying gaps and residual risks, using `partial` or `blocked` rather than silently excluding cases. The approved Playwright candidate set SHALL be derived from that document by the shared derivation rather than persisted as a separate artifact, so a corrected row cannot leave a stale approved set behind it. Summary metrics SHALL be carried by the return envelope.

#### Scenario: Complete strategy
- **WHEN** every plan case is assessed and artifacts validate
- **THEN** the skill returns `completed` with 100 percent case coverage

#### Scenario: Approved set after a corrected row
- **WHEN** an approval or recommended level is corrected in the strategy document
- **THEN** the approved candidate set derived from it reflects the correction, because no separate copy of that set exists
