# 0044 Confidence Model And Surface Area

## Status

Accepted

## Context

The most dangerous failure mode is wrong-but-confident output.

## Decision

Represent confidence as a numeric score plus `low`, `medium`, or `high` label. Surface confidence in:

- the source insight panel
- anomaly messaging
- mastering auto-run eligibility
- exported provenance metadata
- the debug overlay

Low-confidence or blocked states disable silent auto-mastering and force the user to review the source first.

## Consequences

- The UI communicates uncertainty directly.
- Exported artifacts carry enough context for later review.
- Confidence can be regression-tested on real fixtures.

## Alternatives Considered

- Hide confidence from users: rejected because uncertainty is central to trust.
