# Design

## Runner evidence

The importer derives counts and checksums from the Playwright JSON report and the implementation manifest. The agent does not hand-author verification results. Product failures remain valid evidence and map to verification failure rather than workflow failure.

## Durable cycle

Cycle writes use a temporary sibling file followed by rename, so a terminated process cannot leave a partially written state document. Completion records the run ID before selecting another skill.

## Diagnostics

Doctor distinguishes failed requirements from warnings. A missing adapter or Git worktree is a warning because focused runtime operations may still be valid; an unsupported Node version is a failure.
