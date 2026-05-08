# 0012 Metrics And Observability

## Status

Accepted

## Context

Mode A cannot expose server-side metrics and privacy is a core value proposition.

## Decision

Ship no analytics in v1. Local UI progress, errors, and build metadata are the only observability surfaces.

## Consequences

- There is no user tracking or PII collection.
- Product usage must be inferred from GitHub stars, issues, and voluntary feedback.

## Alternatives Considered

- Plausible analytics: deferred until there is a clear need and explicit privacy documentation.
- Cloudflare Worker beacon: rejected because it adds a runtime endpoint.
