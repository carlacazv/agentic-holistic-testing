## Context

The real fixture app and installed Chrome allow deterministic mechanics checks. Performance needs raw evidence separate from durable summaries and two distinct verdict semantics.

## Goals / Non-Goals

**Goals:** declared conditions, repeated evidence, correct budget direction, percentiles, variability, and honest baseline uncertainty.

**Non-Goals:** backend load testing, capacity claims, invented SLAs, or treating local fixture numbers as production benchmarks.

## Decisions

Pin Lighthouse 13.4.1 and run it against the isolated fixture using installed Chrome. A fixture runner captures one Lighthouse report plus repeated API timings to prove integration; module fixtures exercise multiple-run statistics and budgets deterministically. The audit module calculates min/median/p95/max and evaluates lower-is-better or higher-is-better budgets.

## Risks / Trade-offs

- [Local Lighthouse is noisy] → Record conditions and variability; never reuse fixture values as product budgets.
- [Client timing conflates network and server] → Label API values end-to-end and preserve errors/conditions.

## Migration Plan

Install Lighthouse from the public registry, add runner/module/skill/tests/docs, execute fixture evidence, repeat validation, and archive.
