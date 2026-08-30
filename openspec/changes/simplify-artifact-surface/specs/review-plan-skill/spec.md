## MODIFIED Requirements

### Requirement: Measured result
The skill SHALL return before and after metrics, findings, remaining coverage gaps, both bundle checksums, exact modifications, and the improved plan bundle. The durable result SHALL be the improved plan bundle and one review document carrying the declared mode, both checksums, the findings, the modifications, the before and after coverage, and the remaining gaps. The improved bundle SHALL be written in the same canonical plan document form, under the same name, that the plan skill writes, so a plan is read identically whether or not it was reviewed.

#### Scenario: Successful improvement
- **WHEN** seeded omissions and wrong priorities are corrected
- **THEN** after metrics show no regression, resolved findings are traceable to modifications, and the result is `completed`

#### Scenario: Result is read as one document
- **WHEN** a review run finalizes
- **THEN** it holds the improved plan bundle and a single review document rather than a set of separate evidence files

#### Scenario: Reviewed plan read downstream
- **WHEN** a consumer reads the plan produced by a review run
- **THEN** it finds the same canonical document name and shape a plan run produces, without needing to know which stage wrote it
