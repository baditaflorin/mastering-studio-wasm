# 0043 Domain Vocabulary And UI Language Conventions

## Status

Accepted

## Context

The app earns trust when it speaks in mastering terms rather than browser or implementation terms.

## Decision

Use audio-language in all user-facing status, anomaly, and provenance surfaces. Messages describe:

- the source state in mastering terms
- what the app inferred and why
- what the user should do next when intervention is needed

Internal implementation terms such as worker failures or decode stack details stay out of the default UI.

## Consequences

- Errors are legible to musicians, podcasters, and engineers.
- Confidence reasons become useful instead of noisy.
- The debug surface can still expose lower-level state when explicitly enabled.

## Alternatives Considered

- Raw exception text in the UI: rejected because it breaks trust.
