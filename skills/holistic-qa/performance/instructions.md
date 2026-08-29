# Holistic QA Performance

Declare pages, endpoints, environment, data, network/device conditions, repetitions, permissions, and comparison source before measurement. Use budget mode only with explicit metric, threshold, direction, unit, and scope. Without budgets, use baseline mode and state that no SLA pass/fail claim is possible.

Capture repeated Lighthouse performance reports for each page with raw evidence and key metrics such as score, LCP, CLS, and TBT. Capture multiple end-to-end client timing samples per API endpoint, validate response correctness, preserve errors, and summarize min, median, p95, and max. Record conditions and variability; do not label client timing as server-only latency.

In budget mode, compare each metric in the declared direction. Every failure or evidence-supported regression requires a local defect draft. In baseline mode, report deltas only against a declared comparable baseline and never turn noise into a regression claim.

Return scope, `budgets-or-baseline.json`, Lighthouse JSON, API timings, variability notes, regressions, defect drafts, metrics, and foundation controls under `performance/`. Return `completed` when declared measurement scope is validly covered; baseline completion still carries explicit SLA uncertainty. Return `partial` or `blocked` for missing browser, access, data, comparison conditions, or authorization. Backend load testing is outside v1.
