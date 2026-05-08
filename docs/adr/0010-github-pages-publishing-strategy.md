# 0010 GitHub Pages Publishing Strategy

## Status

Accepted

## Context

The live Pages URL is a first-class deliverable and must work from day one.

## Decision

Publish from the `main` branch `/docs` folder at:

https://baditaflorin.github.io/mastering-studio-wasm/

Vite builds into `docs/` with base path `/mastering-studio-wasm/`, while preserving documentation files under `docs/adr`. The build cleans only generated Pages files. `404.html` is copied from `index.html` for SPA fallback behavior.

## Consequences

- A push to `main` updates the live static app.
- Built assets use hashed filenames for cache busting.
- The repository contains generated Pages artifacts and source documentation in the same folder.

## Alternatives Considered

- `gh-pages` branch: rejected to keep local hooks and publish artifacts in one branch.
- GitHub Actions Pages workflow: rejected because this project intentionally uses local hooks and no GitHub Actions.
