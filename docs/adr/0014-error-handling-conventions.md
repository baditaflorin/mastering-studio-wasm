# 0014 Error Handling Conventions

## Status

Accepted

## Context

Browser audio APIs fail for unsupported codecs, memory limits, user cancellation, and WASM loading issues.

## Decision

Represent expected failures as typed `Error` objects with user-facing messages at the feature boundary. The UI shows recoverable errors in a toast/status region. Worker calls return structured progress and throw only when the action cannot continue.

## Consequences

- Users get clear recovery paths.
- Lower-level audio code remains framework-free.

## Alternatives Considered

- Silent fallback: rejected because audio processing failures need to be understandable.
