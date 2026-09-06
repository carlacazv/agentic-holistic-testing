# Holistic QA Report

Combine one or more checksum-valid QA run envelopes into a readable quality recommendation. This skill may be called directly or as the last step of `cycle`.

Validate input run integrity before using it. Keep workflow status, verification outcome, and release recommendation separate: completed QA work may correctly find a product failure.

Recommend:

- `not-ready` for failed verification or an unresolved critical risk;
- `insufficient-evidence` when required work is partial, blocked, failed, or absent;
- `conditional` when evidence is valid but material gaps, residual risks, flaky results, or skipped checks remain;
- `ready` only when the declared scope is complete, verification supports it, and no blocking risk is known.

The result is a recommendation for the declared scope. Name the decision owner when known. Link every conclusion to run IDs and artifacts, explain gaps and residual risk, and never convert an absent check into a pass.

Write `report/report.json` as the canonical document and `report/summary.md` as its readable rendering. Finalize with `verification_status` and `release_recommendation` in the shared envelope.
