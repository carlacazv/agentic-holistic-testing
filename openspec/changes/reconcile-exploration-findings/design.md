# Design

## Execution records

`executions` is an optional array on the session. A `fail` must link at least one finding, and a `pass` may link none. `pass-with-note` covers passing behavior with an observation. Unexecuted statuses (`blocked`, `not-testable`, `not-run`) keep their reason in `notes`. The plan stays out of the validator's input so a session can be validated on its own. `reconcileExecutionsWithPlan(session, plan)` is the explicit cross-check: it rejects unknown case IDs and lists plan cases without a record.

## Reconciliation fields

`classification` defaults to `defect`, so older findings keep their meaning. The other three values each mean that an authoritative source overrode or disputed the requirement text, so they require `oracle_sources`. This forces the skill to cite the sign-off comment, decision record, or sibling story instead of silently dropping a finding. `tracker_refs` records what the tracker already holds. Recording a duplicate is the point: a duplicate becomes a comment, not a new item.

`component` and `cause` stay free text because they are project vocabulary. The instructions forbid inferring them from the page where the symptom appeared.

## Metrics

Metrics stay in the return envelope, as the foundation contract requires. `explorationMetrics` derives them from the session so the numbers the envelope carries cannot drift from the canonical document.
