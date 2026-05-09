# 0049 Inspectability And Debug Surface

## Status

Accepted

## Context

Smart behavior needs a way to be inspected by power users and by us when a real file behaves strangely.

## Decision

Add an inspectability layer made of:

- a source insight panel with classification, confidence, reasons, and anomalies
- an activity log of import, analysis, mastering, cancellation, and export events
- a debug overlay enabled with `?debug=1`
- provenance in exports and in the mastered-result summary

## Consequences

- Support and QA can explain the app's choices.
- Users can see why the first guess happened.

## Alternatives Considered

- Hide the inference engine entirely: rejected because it makes wrong guesses impossible to debug.
