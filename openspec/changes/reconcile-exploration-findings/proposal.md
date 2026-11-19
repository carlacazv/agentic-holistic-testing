# Change: Reconcile exploration findings before they become defects

## Why

A full exploratory run against a 32-story purchase epic showed where the explore skill loses accuracy after execution:

- Case outcomes lived in an ad hoc log outside the session, so the report could not say which planned cases passed, failed, or never ran.
- A later audit reclassified several confirmed "defects": some were deviations accepted at story sign-off, one contradicted an architecture decision record, and others were intended behavior that the requirement text no longer described.
- More than half of the drafted findings already existed in the tracker, opened the same day by another tester.
- Findings named the component where the symptom appeared, not the one that failed.
- A shared payment test card was rate-limited by other testers, account state could not be forged, and time-window cases could not run outside business hours. None of this was declared up front.
- The most severe defects came from forced failures (server errors, aborted polling, a blocked anti-fraud script), a technique the plan had no name for.

## What Changes

- The exploration session gains optional `executions` records per plan case, with outcome, notes, evidence, and linked findings, plus `reconcileExecutionsWithPlan` to surface planned cases without a record.
- Findings gain optional `classification` (`defect`, `accepted-deviation`, `spec-conflict`, `improvement`), `oracle_sources`, `tracker_refs` (`duplicate` or `related`), `component`, `cause`, and `cause_evidence_ids`. Any non-defect classification requires its deciding sources.
- `explorationMetrics` reports execution outcomes and counts only `defect` findings as defects.
- The plan accepts `fault-injection` as a technique.
- Explore and plan instructions add reconciliation against later decisions, a tracker duplicate check before drafting and before publishing, evidence attachment on publication, test-data perishability, and time-window prerequisites.

## Impact

This change touches the explore and plan stages, their instructions, and tests. Every new field is optional, so existing sessions and plans still validate and keep their previous meaning. A finding without `classification` is a defect.

## Non-goals

- No automatic tracker search or publication; both stay operator-approved.
- No change to the report recommendation logic, which already reads envelope metrics.
