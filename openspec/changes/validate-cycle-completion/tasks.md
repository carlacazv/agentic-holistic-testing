## 1. Persistence

- [x] 1.1 Create missing parent directories for cycle state without weakening atomic writes.

## 2. Completion gate

- [x] 2.1 Reject malformed and missing run IDs before changing cycle state.
- [x] 2.2 Reject checksum-invalid runs and envelopes belonging to another skill or run ID.

## 3. Guidance and verification

- [x] 3.1 Document the `run-` prefix and evidence gate in the cycle skill.
- [x] 3.2 Cover successful nested output and all observed benchmark failures with CLI tests.
- [x] 3.3 Pass the complete clean CI validation gate.
