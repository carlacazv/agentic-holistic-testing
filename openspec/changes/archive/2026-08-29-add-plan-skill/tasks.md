## 1. Plan Contract

- [x] 1.1 Add plan bundle schema, controlled values, columns, risk scoring, and traceability validation; verify boundary and malformed-bundle tests pass.
- [x] 1.2 Add deterministic plan metrics and artifact rendering; verify a fixture bundle round-trips and produces checksum-valid durable artifacts.

## 2. Skill and Adapter

- [x] 2.1 Add the provider-neutral `plan` instructions with inputs, techniques, safety, status, and artifact requirements; verify all required sections and outputs are declared.
- [x] 2.2 Register the skill and build the Codex adapter in a clean temporary home; verify the source checksum and generated skill body match.

## 3. Behavioral Verification

- [x] 3.1 Add fixture requirements and risk scenarios covering priority boundaries, strict three-point BVA, decision rules, state, pairwise, error guessing, SFDIPOT, and FEW HICCUPPS; verify the valid fixture passes and seeded omissions fail with exact IDs.
- [x] 3.2 Update current-state documentation and run the complete validation suite twice, including OpenSpec strict validation and contamination scanning.
