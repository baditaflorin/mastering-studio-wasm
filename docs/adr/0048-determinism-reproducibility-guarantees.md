# 0048 Determinism And Reproducibility Guarantees

## Status

Accepted

## Context

An auto-mastering tool needs reproducible output if users are going to trust it in revision workflows.

## Decision

Guarantee deterministic output for identical input bytes and identical mastering options. Enforce this by:

- hashing the input bytes
- deriving an options fingerprint
- avoiding randomness in DSP and metadata layout
- embedding provenance into exports without export-time entropy
- testing repeat WAV exports for byte identity

## Consequences

- Users can rerun a source and trust that the result matches.
- Exported files carry enough metadata to explain why they were produced.

## Alternatives Considered

- Timestamp-rich export metadata: rejected because it breaks byte-identical output.
