## Context

The fixture app and Playwright runner provide real browser execution and evidence configuration. Accessibility adds axe plus an auditable manual checklist and status logic.

## Goals / Non-Goals

**Goals:** combined evidence, criterion-level status, linked defects, and honest conformance boundaries.

**Non-Goals:** accessibility certification, automated replacement for assistive-technology testing, or external issue publication.

## Decisions

Pin `@axe-core/playwright` 4.13.0 and add a WCAG-tagged fixture scan. A normalized audit module requires representative manual criteria and enforces defect links for failures. Unresolved checks are first-class and prevent completed status. Rendering keeps axe JSON, manual/unresolved CSVs, evidence, and defect drafts separate.

## Risks / Trade-offs

- [Representative fixture cannot prove target products] → It verifies the skill mechanics only; target runs must declare their own scope and evidence.
- [WCAG interpretation requires expertise] → Preserve methods, evidence, uncertainty, and no certification claim.

## Migration Plan

Install axe from the verified public registry, add fixture scan/module/skill/tests/docs, repeat validation, and archive.
