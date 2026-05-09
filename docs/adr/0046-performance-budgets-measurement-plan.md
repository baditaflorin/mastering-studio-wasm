# 0046 Performance Budgets And Measurement Plan

## Status

Accepted

## Context

Mode A keeps all audio work in the browser, so memory and responsiveness limits are product constraints.

## Decision

Use these budgets:

- show visible progress for operations above 300ms
- make long mastering runs cancellable
- block import above the hard file-size ceiling
- disable auto-master for long-form or high-memory sources
- keep heavy DSP work in a worker

Measurement plan:

- fixture-based classification and mastering timings recorded in the Phase 2 postmortem
- manual profiling of the hottest paths on long-form and clipped fixtures
- build and smoke checks must keep the UI responsive through import and mastering

## Consequences

- The app stays honest about browser limits.
- Long-form support is intentionally cautious rather than accidental.

## Alternatives Considered

- Unlimited in-browser decode and process: rejected because it fails unpredictably across machines.
