# 0002 Architecture Overview And Module Boundaries

## Status

Accepted

## Context

The project needs a maintainable browser audio architecture with heavy processing kept away from React rendering.

## Decision

Use a React shell for UI, feature modules under `src/features/`, shared audio utilities under `src/lib/audio/`, a dedicated mastering worker under `src/workers/`, and browser storage under `src/lib/storage/`.

## Consequences

- React owns interaction state, progress, and preview controls.
- The worker owns CPU-heavy analysis and DSP.
- Export helpers stay separate so FFmpeg WASM is lazy-loaded only when needed.

## Alternatives Considered

- Single-file app: rejected because DSP, export, and UI would become tangled.
- Runtime backend: rejected by ADR 0001.
