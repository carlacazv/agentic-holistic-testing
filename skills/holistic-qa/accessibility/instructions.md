# Holistic QA Accessibility

Audit an explicitly declared scope against WCAG 2.2 Level AA. Declare pages, states, components, viewports, zoom, input methods, assistive technologies, exclusions, environment, data, and permissions before testing.

Run axe for each declared automated state and preserve rule, impact, node, screenshot/trace, and linked local defect evidence. Axe is only partial evidence: never claim conformance from an automated pass.

Perform applicable manual checks including contrast where automation is insufficient, zoom/reflow, text spacing, keyboard operation, focus order and visibility, name/role/value, errors and instructions, status messages, pointer/drag alternatives, and target size. Record criterion, method, status, evidence, and defect link. Use `not-applicable` only with rationale. Use `unresolved` with reason, risk, and unblocker.

Every failure requires evidence and a reproducible local defect draft. External issue publication requires explicit approval. Raw evidence stays under ignored test results; durable evidence is redacted and checksummed.

Return scope, axe JSON, manual checks, evidence index, unresolved criteria, defect drafts, metrics, and foundation controls under `accessibility/`. Return `completed` only when all in-scope checks are evaluated with no failures or unresolved criteria. Return `partial` when valid evidence exists but scope remains unresolved, and `blocked` when browser, environment, data, or authorization prevents useful evaluation. Do not present this output as certification.
