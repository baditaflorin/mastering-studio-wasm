# 0003 Frontend Framework And Build Tooling Choice

## Status

Accepted

## Context

The app needs a responsive GUI, strict TypeScript, fast local development, and GitHub Pages-compatible static builds.

## Decision

Use React, TypeScript strict mode, Vite, Tailwind CSS, Vitest, Playwright, ESLint, and Prettier.

## Consequences

- Vite handles hashed assets and worker bundling.
- React keeps stateful UI straightforward.
- Tailwind provides local styling primitives without runtime CSS-in-JS.

## Alternatives Considered

- Vanilla TypeScript: rejected because the UI has enough state to justify React.
- Next.js: rejected because server features are unnecessary and add static export complexity.
