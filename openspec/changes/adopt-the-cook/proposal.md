# Adopt The Cook for contributor agents

## Why

Codex and Claude Code need one versioned source of repository permissions and skills, with a reproducible check for generated configuration drift.

## What Changes

- Pin Cook and its agents recipes at 13.0.0, preserving existing instructions and OpenSpec skills.
- Render native settings for both harnesses and commit relative links.
- Add Mise preview, apply, and validation tasks and a separate CI gate.
- Scan versioned symlink text without reading directory or external targets.

## Capabilities

### New Capabilities

- `contributor-agent-configuration`: shared contributor-agent configuration and drift validation.

### Modified Capabilities

None. Consumer QA installation and runtime behavior are unchanged.

## Impact

Contributor setup, GitHub Actions, repository documentation, and the contamination scanner. Cook is needed only for configuration maintenance and its CI check.
