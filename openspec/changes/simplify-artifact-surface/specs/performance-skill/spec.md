## MODIFIED Requirements

### Requirement: Durable honest return
The skill SHALL return scope, budgets or baseline, Lighthouse evidence, API evidence, variability notes, regressions, and linked defects as one canonical audit document, rendered by one summary document, with each defect keeping its own draft. The evaluated budgets, including each declared threshold, its actual value, and whether it was satisfied in its declared direction, SHALL be carried inside that document, and metrics SHALL be carried by the return envelope. Raw Lighthouse reports SHALL remain under the ignored raw evidence directory while the per-run metric values the audit reasons about are carried by the canonical document. Missing capability or incomplete scope SHALL be partial or blocked.

#### Scenario: Complete baseline
- **WHEN** all scope is measured comparably without budgets
- **THEN** the result may be completed as baseline establishment while retaining explicit SLA uncertainty

#### Scenario: Budget evaluation is read from the audit
- **WHEN** budgets are compared in their declared direction
- **THEN** the threshold, the actual value, and the outcome are read from the canonical audit document rather than from a separate budgets artifact
