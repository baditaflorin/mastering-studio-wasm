# 0001 Deployment Mode

## Status

Accepted

## Context

The app needs to decode audio, analyze loudness, run an automatic mastering chain, preview results, and export audio. The default architectural bias is GitHub Pages first.

## Decision

Use Mode A: Pure GitHub Pages. The app is a static Vite build served from `main` branch `/docs`. Audio processing runs in the browser using Web Audio primitives, a Web Worker, IndexedDB, and lazy-loaded FFmpeg WASM assets.

## Consequences

- Audio stays private and does not leave the user's browser.
- There is no runtime server, auth, database, Docker image, nginx config, or Prometheus endpoint in v1.
- Browser CPU and memory limits define the practical max track length.
- GitHub Pages cannot set COOP/COEP headers, so WASM choices must work without requiring cross-origin isolation.

## Alternatives Considered

- Mode B with pre-built data artifacts: rejected because there is no shared static dataset.
- Mode C with Docker backend: rejected because there are no secrets, mutations, cross-device sync, or runtime APIs required for v1.
