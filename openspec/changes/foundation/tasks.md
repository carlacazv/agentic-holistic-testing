## 1. Package and Contracts

- [ ] 1.1 Create the Node.js package, public exports, ignore rules, and versioned JSON Schemas; verify package metadata and schema fixtures load without errors.
- [ ] 1.2 Implement canonical JSON, SHA-256 checksums, safe run IDs, deterministic record IDs, and RFC 4180 CSV helpers; verify positive, boundary, and malformed-input unit tests pass.

## 2. Safety Runtime

- [ ] 2.1 Implement evidence redaction with configured-secret and common-credential coverage; verify secrets are absent from promoted durable fixtures and replacement counts are correct.
- [ ] 2.2 Implement environment, credential-reference, capability, approval, production, and browser-resolution validation; verify denial and fallback scenario tests pass.
- [ ] 2.3 Implement safe durable/raw run storage, symlink/path-escape protection, artifact registration, checksums, and atomic writes; verify isolation and tampering tests pass.
- [ ] 2.4 Implement return-envelope creation and finalization gates; verify invalid completion claims, partial results, blocked errors, and artifact-index validation behave as specified.

## 3. Interfaces and Packaging

- [ ] 3.1 Implement the JSON CLI for schema, artifact, permission, browser, and run validation; verify fixture commands return deterministic output and correct exit codes.
- [ ] 3.2 Add the pinned optional Playwright MCP manifest and verify exact-version enforcement and fallback resolution.
- [ ] 3.3 Implement provider-neutral skill-source discovery and the Codex adapter renderer; verify a clean temporary Codex home contains every declared skill and source/output checksums match.

## 4. Verification and Delivery

- [ ] 4.1 Add deterministic fixture scenarios and Node test coverage for every foundation requirement; verify the complete test suite passes repeatedly.
- [ ] 4.2 Add GitHub Actions checks for tests, OpenSpec strict validation, adapter validation, public-registry configuration, and contamination scanning; verify workflow syntax and local equivalents pass.
- [ ] 4.3 Document the foundation safety and artifact contracts without claiming phase-2 Claude support; verify examples execute and all versioned content passes credential/private-registry contamination scans.
