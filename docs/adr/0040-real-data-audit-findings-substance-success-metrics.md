# 0040 Real-Data Audit Findings And Substance Success Metrics

## Status

Accepted

## Context

Phase 1 proved the happy path. Phase 2 needs a fixed real-data rubric so logic changes are judged by user outcomes instead of demos.

## Decision

Use the 10 committed fixtures in `test/fixtures/realdata/` as the grading set for Phase 2. Treat the audit in `docs/phase2-substance/realdata-audit.md` as the source of truth for logic gaps, pass rate, and regression checks.

Success is defined as:

- at least 7 of 10 fixtures complete the primary flow with no manual preset change
- at least 9 of 10 fixtures receive a correct classification or an explicit warning
- every failure reports what failed, why, and the next step
- deterministic WAV export for identical input and settings
- long-form work shows progress and can be cancelled

## Consequences

- Every inference or DSP change must be measured against the same fixture set.
- Red fixtures block a release.
- The postmortem can compare before and after behavior concretely.

## Alternatives Considered

- Curated demo-only inputs: rejected because they hide the real failure modes.
- Synthetic-only fixtures: rejected because they miss the messy edge cases users actually upload.
