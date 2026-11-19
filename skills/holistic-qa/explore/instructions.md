# Holistic QA Explore

Run a timeboxed exploratory session only after declaring mission, scope, target risks, environment, permitted capabilities, test data, heuristics, and stop conditions. Resolve browser capability through the foundation fallback order. State-changing execution is limited to explicitly authorized non-production environments; production remains read-only.

Use heuristics that fit the charter, explicitly considering SFDIPOT and FEW HICCUPPS. Record timestamped actions, observations, questions, and oracles. Record coverage areas and depth plus every unavailable or intentionally skipped area. An empty observation set does not prove absence of defects.

Keep raw screenshots, traces, video, console, and network evidence under `test-results/<run-id>/`. Promote only redacted durable evidence and index it with stable ID, type, paths, checksum, confidence, and linked record.

## Record every planned case

When the session runs against a plan, write one `executions` record per plan case it touched: `case_id`, `status` (`pass`, `pass-with-note`, `fail`, `blocked`, `not-testable`, `not-run`), `notes`, and the evidence and defect IDs behind it. A `fail` links at least one finding; a `pass` links none. Keep blocked and not-run cases with the concrete reason (missing data, time window, disabled feature, shared credential locked) instead of dropping them. Run `reconcileExecutionsWithPlan` and report `unrecorded_case_ids` as gaps. Record cases the session added beyond the plan with their own IDs.

## Provoke failures deliberately

Failure handling is where most confirmed defects in a purchase or payment journey live. When the charter covers recovery behavior and the environment is authorized, intercept requests in the browser to force server errors, aborted connections, partial failures of one dependency among several, out-of-vocabulary responses, blocked third-party scripts, and a skewed client clock. Record each injection as an action note so the defect folder can reproduce it.

## Reconcile a finding before calling it a defect

A mismatch against one requirement is not yet a defect. Before confirming, look for later decisions that may override the requirement text: approval or review comments on the story, architecture decision records and design documents in the implementing repositories, sibling stories that redefine copy or behavior, and accepted deviations recorded at sign-off. Set `classification` to `defect`, `accepted-deviation`, `spec-conflict` (two authoritative sources disagree), or `improvement`, and list the deciding `oracle_sources`. Anything other than `defect` requires those sources. Surface spec conflicts to the owner instead of filing them as bugs.

Name the `component` only when the failing request or source code shows it, not from the page where the symptom appeared. State `cause` only when it was traced to code, data, or a response; otherwise leave it undetermined. Link tracing evidence in `cause_evidence_ids`.

## Check the tracker before drafting

Search the tracker for each finding before writing its draft, including items opened the same day by people or other agents working the same scope. Search by symptom text, route, error name, and story ID, and read candidate items instead of trusting titles. Record matches in `tracker_refs` with `relation` `duplicate` or `related`. A duplicate gets new evidence as a comment on the existing item, never a second item. Re-run the search immediately before publishing, because the tracker may have changed during the session.

## Treat test data as a shared, perishable resource

Shared credentials and payment test instruments can be rate-limited or locked by other testers. When one fails for that reason, record it, switch to the provider's documented test data, and cite the source. Accounts whose state cannot be forged (record age, verification timestamps) and cases that depend on the time of day (for example, slots less than N minutes away) belong in the prerequisites with the window in which they can run; outside it, record them as `not-run` with the window. Do not create accounts or enter credentials unless the charter authorizes it and the operator's policy allows it; otherwise declare the missing account as a blocked prerequisite early.

## Defect folders

Create one `explore/defects/<defect-id>/reproduction.md` folder per confirmed or suspected defect. Include status, environment, preconditions, exact steps, expected/actual results, reproducibility, severity rationale, evidence, and follow-up. Confirmed defects require evidence; uncertain observations remain suspected. Draft locally only—external publication requires explicit approval. When publishing is approved, attach the durable evidence images to the tracker item itself instead of linking local paths.

Finalize with `explorationMetrics(session)` as the envelope metrics, so accepted deviations, spec conflicts, and improvements never count as defects in a report.

Required returns are the canonical `explore/session.json`, readable `explore/summary.md`, one reproduction folder per defect, and foundation controls. The session document carries the charter, notes, coverage, and evidence index; do not persist duplicate views. Return `partial` for useful sessions with unavailable charter areas, `blocked` when a required environment/browser/data/permission prevents useful execution, and never silently exclude coverage.
