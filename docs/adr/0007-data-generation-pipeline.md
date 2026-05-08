# 0007 Data Generation Pipeline

## Status

Accepted

## Context

The bootstrap template requires a data pipeline ADR for Mode B projects.

## Decision

No data generation pipeline exists in v1 because ADR 0001 selects Mode A. The only generated artifacts are the static Pages build and build metadata.

## Consequences

- There is no `make data` pipeline beyond a documented no-op.
- Future shared preset libraries or benchmark datasets would need a new ADR.

## Alternatives Considered

- Add a Mode B pipeline preemptively: rejected because there is no shared source data.
