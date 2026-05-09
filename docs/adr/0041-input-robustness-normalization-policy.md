# 0041 Input Robustness And Normalization Policy

## Status

Accepted

## Context

The browser decode pipeline is vulnerable to bad headers, oversized files, renamed non-audio files, silence, and exotic channel layouts.

## Decision

Add an explicit preflight stage before decode. Preflight:

- sniffs the first bytes and compares them against the file extension
- estimates decoded memory cost and blocks files above the hard limit
- warns on suspicious extension-header mismatches
- produces user-facing anomalies for invalid, risky, or misleading inputs

Normalization policy:

- trust the binary header over the file extension
- treat silence, multichannel sources, and invalid headers as blockers
- treat long-form, clipped, wide, DC-biased, and rumble-heavy content as analyzable anomalies

## Consequences

- Bad files fail early with audio-specific guidance.
- The app stays honest about browser memory cliffs.
- Import becomes a staged operation instead of a blind decode attempt.

## Alternatives Considered

- Rely on `decodeAudioData()` alone: rejected because the resulting errors are late and opaque.
