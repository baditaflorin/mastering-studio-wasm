# 0011 Logging Strategy

## Status

Accepted

## Context

Mode A has no server logs, but browser errors need to be visible during development.

## Decision

Use minimal browser console logging in development. In production, expected errors are shown through UI state and toasts. Unexpected errors are captured by the React error boundary and rendered as user-facing recovery messages.

## Consequences

- No PII or audio metadata is transmitted.
- Production console noise stays low.

## Alternatives Considered

- Remote error reporting: rejected to keep the app private and analytics-free in v1.
