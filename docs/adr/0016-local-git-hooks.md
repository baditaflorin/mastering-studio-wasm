# 0016 Local Git Hooks

## Status

Accepted

## Context

The project does not use GitHub Actions. Checks need to run locally.

## Decision

Use a plain `.githooks/` directory wired through `git config core.hooksPath .githooks`. Hooks run formatting checks, linting, type checks, secret scanning, tests, build, and smoke tests.

## Consequences

- Contributors must run `make install-hooks` once per clone.
- Pushes are slower but catch regressions before publishing.

## Alternatives Considered

- Lefthook: rejected because plain hooks are enough for this single frontend app.
