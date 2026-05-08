# 0015 Deployment Topology

## Status

Accepted

## Context

Deployment topology depends on ADR 0001.

## Decision

Use GitHub Pages only. There is no Docker Compose topology, nginx config, backend port, or server runbook in v1.

## Consequences

- Deployment is a git push to `main` after `make build`.
- Rollback is a git revert of the Pages publishing commit.

## Alternatives Considered

- Docker backend behind nginx: rejected because Mode C is unnecessary.
