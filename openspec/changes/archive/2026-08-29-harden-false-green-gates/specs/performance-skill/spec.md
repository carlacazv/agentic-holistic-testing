## MODIFIED Requirements

### Requirement: Lighthouse evidence
The skill SHALL capture Lighthouse performance evidence for declared pages, including raw reports, key metrics, run conditions, and repeated-run variability. Each declared page SHALL carry at least three comparable runs of its own, so repeatability is established per page rather than across the audit total.

#### Scenario: Variable page result
- **WHEN** repeated Lighthouse metrics vary materially
- **THEN** the summary reports the distribution and confidence limitation rather than a single definitive value

#### Scenario: Page measured once
- **WHEN** a declared page carries fewer than three comparable runs while other pages carry more
- **THEN** validation fails and names the under-measured page rather than accepting the audit total as evidence

### Requirement: Budgets and regressions
Budget mode SHALL evaluate each metric using its declared direction, threshold, and unit. Every budget SHALL declare an identifier, an evidence source, a target, a metric, a distribution statistic, a direction, a finite threshold, and a unit, each drawn from the values the runtime supports, and a budget that does not SHALL be rejected rather than compared under an assumed direction. Baseline comparison SHALL identify deltas but label regression only when a declared comparison rule supports it.

#### Scenario: Budget exceeded
- **WHEN** a measured value violates a declared threshold
- **THEN** the result records a regression with evidence and a linked local defect draft

#### Scenario: Unrecognized direction
- **WHEN** a budget declares a direction outside the supported values
- **THEN** validation fails naming the budget and the comparison does not pass
