# Holistic QA Automation Strategy

Assess every case in a checksum-valid plan and recommend the lowest level that provides equivalent confidence. This skill decides what to automate; it does not generate test code.

For each planned case, record:

- Recommended level: unit, component, API, browser E2E, or manual.
- Playwright browser and API suitability.
- Impact value, stability, and cost as separate 1–5 values.
- Decision: automate, manual, or defer.
- Explicit implementation approval and evidence-based rationale.

Push coverage down in this order when confidence is equivalent: unit, component, API, browser E2E. Keep browser E2E for browser-only user risk, integration confidence, or behavior not observable below the UI. Keep human judgment, visual nuance, and inherently unstable/uncontrolled checks manual. Do not remove higher-level or manual coverage merely because a lower-level test exists.

Only `automate` rows with explicit approval and recommended level API or browser E2E enter `approved-playwright-candidates.json`. A recommendation is not approval. Record gaps and residual risks for deferred or unavailable coverage; never silently omit a plan case.

Required artifacts are `automation-strategy/candidate-matrix.csv`, `automation-strategy/approved-playwright-candidates.json`, `automation-strategy/metrics.json`, and foundation control files. Return `completed` only at 100% assessed cases, `partial` for valid incomplete scope, and `blocked` when the upstream plan fails integrity validation.
