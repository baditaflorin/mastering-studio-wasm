# 0009 Configuration And Secrets Management

## Status

Accepted

## Context

The frontend must never contain secrets. Build metadata needs local defaults.

## Decision

Use `.env.example` for non-secret build-time values only. Real `.env*` files are gitignored. The app has no API keys, tokens, or passwords.

## Consequences

- Secret scanning remains simple.
- Build metadata can be overridden locally without risking credentials.

## Alternatives Considered

- Runtime config endpoint: rejected because no backend exists.
