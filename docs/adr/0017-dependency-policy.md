# 0017 Dependency Policy

## Status

Accepted

## Context

The app touches user media locally, so dependencies should be boring and maintainable.

## Decision

Use production-ready libraries for the framework, build, caching, storage, icons, WASM export, and tests. Keep core DSP code local because the browser mastering chain needs tight control over memory transfer, offline rendering, and deterministic tests.

## Consequences

- Dependency surface stays moderate.
- DSP code requires careful tests and documentation.
- FFmpeg handles codec export instead of a custom encoder.

## Alternatives Considered

- Pull in a full DAW/audio engine: rejected as too heavy for the v1 scope.
