# 0042 Inference Engine And Confidence

## Status

Accepted

## Context

Phase 1 used static presets and assumed the user would know whether the source was speech, music, already mastered, or risky.

## Decision

Infer a `SourceProfile` from measured audio metrics plus preflight signals. The profile includes:

- source classification: `speech`, `music`, `mixed`, `unknown`, or `invalid`
- source state: `raw`, `dynamic`, `hot-master`, `long-form`, `wide`, `silence`, `multichannel`, or `anomalous`
- recommended preset and tuned options
- confidence score and confidence label
- anomaly list, reasons, and auto-master eligibility

The heuristics prefer conservative behavior. When evidence is mixed, the app falls back to explicit warnings instead of confident claims.

## Consequences

- The first guess is useful on common inputs.
- The mastering chain can adapt before the user touches a control.
- Fixture tests can validate classification and confidence as first-class outputs.

## Alternatives Considered

- User-selected presets only: rejected because it keeps the app toy-like.
- Opaque ML-only classification: rejected for v2 because inspectability is required.
