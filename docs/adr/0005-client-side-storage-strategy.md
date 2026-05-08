# 0005 Client-Side Storage Strategy

## Status

Accepted

## Context

The app benefits from remembering small preferences and the last analysis summary, but raw audio persistence is risky and unnecessary.

## Decision

Use IndexedDB through `idb` for small metadata only. Do not persist source audio or mastered audio in v1.

## Consequences

- User privacy and disk usage stay predictable.
- The app can show recent target settings and last-run summary.
- Users must re-import audio after a reload.

## Alternatives Considered

- OPFS for audio files: deferred until explicit project/session persistence exists.
- `localStorage`: rejected for structured metadata and future migration flexibility.
