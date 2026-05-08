# Postmortem

## What Was Built

`mastering-studio-wasm` v1 is a static GitHub Pages app for private browser mastering. It imports audio, decodes with Web Audio, analyzes EBU R128-style integrated loudness, runs an adaptive mastering chain in a Web Worker, previews original versus mastered audio, and exports WAV or MP3 through lazy-loaded FFmpeg WASM.

Live site:

https://baditaflorin.github.io/mastering-studio-wasm/

Repository:

https://github.com/baditaflorin/mastering-studio-wasm

## Was Mode A Correct?

Yes. Mode A was the right choice in hindsight. The core workflow does not need auth, server persistence, secrets, cross-device sync, or a runtime API. Keeping processing in the browser also directly supports the privacy value proposition.

Mode B would not help because there is no shared dataset to precompute. Mode C would add hosting, Docker, nginx, CORS, and observability work without improving the first useful mastering flow.

## What Worked

- GitHub Pages from `main` `/docs` worked cleanly once the build stopped deleting source docs.
- Web Worker mastering kept the React UI responsive.
- Same-origin FFmpeg WASM avoids CDN reliance and keeps the app purely static.
- Playwright smoke testing caught a real Pages base-path navigation issue.

## What Did Not Work

- Building directly into `docs/` initially removed ADR and documentation files. The fix was to preserve `docs/` and clean only generated Pages assets.
- Copying FFmpeg into `public/` before build duplicated a 31 MB WASM file and hit local disk pressure. The fix was to copy FFmpeg directly into `docs/vendor/` after Vite builds.

## What Surprised Us

The Vite/Vitest version pairing mattered: Vitest 2 pulled its own Vite 5 dependency and caused config type conflicts with Vite 6. Upgrading Vitest resolved it.

## Accepted Tech Debt

- Loudness analysis is an EBU R128/BS.1770-style implementation with deterministic tests, not a formal certification suite.
- The limiter is a practical peak-safe soft limiter, not a full inter-sample true-peak limiter.
- Browser memory limits are documented but not yet surfaced as proactive per-file estimates.
- MP3 export depends on a large FFmpeg WASM payload, loaded only on demand.

## Time Spent Vs Estimate

Estimated: 2-3 focused hours for a functional v1 scaffold and implementation.

Actual: about 2 hours for scaffold, app, tests, Pages build, smoke, and documentation.

## Next 3 Improvements

1. Add a reference-track matching mode with spectral tilt and loudness target extraction.
2. Add true-peak oversampling and a stronger limiter model for hotter masters.
3. Add offline project persistence through OPFS for users who want to resume large sessions.
