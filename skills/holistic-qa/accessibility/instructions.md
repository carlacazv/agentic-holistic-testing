# Holistic QA Accessibility

Audit an explicitly declared scope against WCAG 2.2 Level AA. Declare pages, states, components, viewports, zoom, input methods, assistive technologies, exclusions, environment, data, and permissions before testing.

Run axe for each declared automated state and preserve rule, impact, node, screenshot/trace, and linked local defect evidence. Axe is only partial evidence: never claim conformance from an automated pass.

Perform applicable manual checks including contrast where automation is insufficient, zoom/reflow, text spacing, keyboard operation, focus order and visibility, name/role/value, errors and instructions, status messages, pointer/drag alternatives, and target size. Record criterion, method, status, evidence, and defect link. A manual pass or fail requires valid evidence; an unsupported claim remains unresolved. Use `not-applicable` only with rationale. Use `unresolved` with reason, risk, and unblocker.

Every failure requires evidence and a reproducible local defect draft. External issue publication requires explicit approval. Raw evidence stays under ignored test results; durable evidence is redacted and checksummed.

Return `accessibility/audit.json` as the canonical scope, axe, manual, evidence, and defect document; return `accessibility/summary.md`, defect drafts, and foundation controls. Derive unresolved criteria in the summary and keep metrics only in the envelope. Workflow status describes whether the audit work completed; verification status describes whether the product passed. A completed audit may contain evidenced failures and a not-ready recommendation. Return `partial` when valid evidence exists but scope remains unresolved, and `blocked` when browser, environment, data, or authorization prevents useful evaluation. Do not present this output as certification.
