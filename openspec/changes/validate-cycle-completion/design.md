# Design: Evidence-gated cycle completion

The CLI remains the trust boundary for persisted cycle state. `cycle-complete` resolves the conventional `qa/runs/<run-id>` directory from the consuming workspace, validates its control files and artifact checksums, then verifies that the return envelope belongs to both the supplied run ID and expected skill. Only after all checks pass may it atomically update cycle state.

State output uses the existing atomic temporary-file rename and creates only the exact missing parent path requested by the caller.
