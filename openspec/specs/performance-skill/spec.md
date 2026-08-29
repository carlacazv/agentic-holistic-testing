# performance-skill Specification

## Purpose
Evaluates declared performance budgets or establishes a comparable Lighthouse and API timing baseline with raw samples, variability, uncertainty, and linked regressions.

## Requirements

### Requirement: Declared mode and scope
Each run SHALL declare pages, endpoints, environment, data, network/device conditions, repetition count, and either budget or baseline mode. Baseline mode SHALL not invent pass/fail thresholds.

#### Scenario: No budgets provided
- **WHEN** comparable budgets are absent
- **THEN** the run records a baseline and uncertainty without claiming an SLA pass

### Requirement: Lighthouse evidence
The skill SHALL capture Lighthouse performance evidence for declared pages, including raw reports, key metrics, run conditions, and repeated-run variability. Each declared page SHALL carry at least three comparable runs of its own, so repeatability is established per page rather than across the audit total.

#### Scenario: Variable page result
- **WHEN** repeated Lighthouse metrics vary materially
- **THEN** the summary reports the distribution and confidence limitation rather than a single definitive value

#### Scenario: Page measured once
- **WHEN** a declared page carries fewer than three comparable runs while other pages carry more
- **THEN** validation fails and names the under-measured page rather than accepting the audit total as evidence

### Requirement: API timing evidence
The skill SHALL record multiple request samples per endpoint, response correctness, percentile summaries, errors, and comparable conditions without presenting client timing as server-only latency.

#### Scenario: Failed response sample
- **WHEN** an API timing sample returns an unexpected response
- **THEN** it is recorded as an error and excluded from successful-latency claims

### Requirement: Budgets and regressions
Budget mode SHALL evaluate each metric using its declared direction, threshold, and unit. Every budget SHALL declare an identifier, an evidence source, a target, a metric, a distribution statistic, a direction, a finite threshold, and a unit, each drawn from the values the runtime supports, and a budget that does not SHALL be rejected rather than compared under an assumed direction. Baseline comparison SHALL identify deltas but label regression only when a declared comparison rule supports it.

#### Scenario: Budget exceeded
- **WHEN** a measured value violates a declared threshold
- **THEN** the result records a regression with evidence and a linked local defect draft

#### Scenario: Unrecognized direction
- **WHEN** a budget declares a direction outside the supported values
- **THEN** validation fails naming the budget and the comparison does not pass

### Requirement: Durable honest return
The skill SHALL return scope, budgets or baseline, Lighthouse evidence, API evidence, variability notes, regressions, linked defects, metrics, and foundation controls. Missing capability or incomplete scope SHALL be partial or blocked.

#### Scenario: Complete baseline
- **WHEN** all scope is measured comparably without budgets
- **THEN** the result may be completed as baseline establishment while retaining explicit SLA uncertainty
