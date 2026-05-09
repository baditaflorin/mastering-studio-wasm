# 0045 State Taxonomy And State Machine

## Status

Accepted

## Context

Import, analysis, mastering, export, and cancellation were previously tracked as loose booleans. That made half-finished states easy to create.

## Decision

Model the app as an explicit staged workflow:

1. idle
2. preflight
3. decoding
4. analyzed
5. blocked
6. ready-to-master
7. mastering
8. cancelled
9. mastered
10. exporting
11. recoverable-error

The canonical state descriptions live in `docs/phase2-substance/states.md`. Every state must have at least one user-actionable exit.

## Consequences

- Cancellation can restore a coherent analyzed state.
- UI status copy maps to intentional system states.
- Future features have a stable state vocabulary to extend.

## Alternatives Considered

- Continue with independent booleans: rejected because it makes conflicting states easy.
