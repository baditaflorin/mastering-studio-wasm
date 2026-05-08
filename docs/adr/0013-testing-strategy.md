# 0013 Testing Strategy

## Status

Accepted

## Context

Audio DSP logic needs deterministic tests. The UI needs a fast smoke path.

## Decision

Use Vitest for unit tests, Testing Library where component coverage is useful, and Playwright for one browser happy path. `make test` runs unit tests. `make smoke` builds the Pages output, serves it at the GitHub Pages base path, and runs Playwright.

## Consequences

- Core loudness and encoding utilities can be tested without a browser.
- The smoke test catches broken Pages base paths and broken happy-path mastering.

## Alternatives Considered

- Only manual testing: rejected because build and Pages path regressions are likely.
