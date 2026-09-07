# Holistic QA Explore

Run a timeboxed exploratory session only after declaring mission, scope, target risks, environment, permitted capabilities, test data, heuristics, and stop conditions. Resolve browser capability through the foundation fallback order. State-changing execution is limited to explicitly authorized non-production environments; production remains read-only.

Use heuristics that fit the charter, explicitly considering SFDIPOT and FEW HICCUPPS. Record timestamped actions, observations, questions, and oracles. Record coverage areas and depth plus every unavailable or intentionally skipped area. An empty observation set does not prove absence of defects.

Keep raw screenshots, traces, video, console, and network evidence under `test-results/<run-id>/`. Promote only redacted durable evidence and index it with stable ID, type, paths, checksum, confidence, and linked record.

Create one `explore/defects/<defect-id>/reproduction.md` folder per confirmed or suspected defect. Include status, environment, preconditions, exact steps, expected/actual results, reproducibility, severity rationale, evidence, and follow-up. Confirmed defects require evidence; uncertain observations remain suspected. Draft locally only—external publication requires explicit approval.

Required returns are the canonical `explore/session.json`, readable `explore/summary.md`, one reproduction folder per defect, and foundation controls. The session document carries the charter, notes, coverage, and evidence index; do not persist duplicate views. Return `partial` for useful sessions with unavailable charter areas, `blocked` when a required environment/browser/data/permission prevents useful execution, and never silently exclude coverage.
