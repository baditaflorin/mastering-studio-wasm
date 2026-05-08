# 0004 Static Data Contract

## Status

Accepted

## Context

Mode A has no backend and no generated shared data pipeline.

## Decision

Static data is limited to versioned build metadata and static WASM assets:

- `version.json` is generated into `docs/` with app version, commit, and build time.
- FFmpeg core files are copied into `/vendor/ffmpeg-core/` in the Pages output.

## Consequences

- No freshness UI is needed for external datasets.
- Build metadata lets the page display version and commit.
- WASM asset paths are same-origin and cacheable.

## Alternatives Considered

- GitHub Release-hosted artifacts: rejected for v1 because FFmpeg core can be served directly from Pages.
