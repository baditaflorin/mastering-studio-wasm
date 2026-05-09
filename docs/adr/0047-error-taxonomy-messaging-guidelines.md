# 0047 Error Taxonomy And Messaging Guidelines

## Status

Accepted

## Context

Generic browser decode errors are not actionable enough for mastering users.

## Decision

Represent expected user-facing failures with typed errors and anomaly objects. Every surfaced failure must include:

- what failed
- why it failed, in audio-domain language
- what the user can do next

Recoverable issues stay attached to the analyzed source. Fatal issues stop the current operation but preserve prior session state when possible.

## Consequences

- Users get next steps instead of dead ends.
- Errors can be rendered consistently across import, mastering, and export.

## Alternatives Considered

- Free-form error strings at call sites: rejected because they drift and become inconsistent.
