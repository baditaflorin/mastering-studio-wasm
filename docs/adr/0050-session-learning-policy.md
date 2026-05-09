# 0050 Session Learning Policy

## Status

Accepted

## Context

Users often repeat the same content type within a session. If the app learns obvious overrides, it can remove repeated setup without hiding behavior.

## Decision

Remember manual mastering-option overrides per inferred source classification for the current session only. Reuse those overrides as the next first guess and surface when session learning was applied.

The app does not persist this learning across devices or across sessions in Phase 2.

## Consequences

- Repeated podcast or music jobs get faster during a session.
- Learning remains transparent and reversible.

## Alternatives Considered

- No learning at all: rejected because it leaves repetitive corrections on the table.
- Permanent learned defaults: rejected for now because that needs stronger explainability and reset controls.
