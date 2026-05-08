# 0006 WASM Modules Used

## Status

Accepted

## Context

Compressed audio export is best handled by a proven encoder. GitHub Pages cannot set custom COOP/COEP headers.

## Decision

Use `@ffmpeg/ffmpeg` with `@ffmpeg/core` as a lazy-loaded, same-origin WASM module for MP3 export. Keep core mastering DSP in TypeScript so the app works even before FFmpeg is loaded. Use the single-thread FFmpeg core path so cross-origin isolation is not required.

## Consequences

- First load stays small because FFmpeg is loaded only on export.
- The app can provide WAV export immediately and MP3 export after WASM initialization.
- FFmpeg core assets are committed in the Pages build output.

## Alternatives Considered

- CDN-hosted FFmpeg core: rejected to keep the runtime static and same-origin.
- Server-side FFmpeg: rejected by ADR 0001.
