# 0008 Go Backend Project Layout

## Status

Accepted

## Context

The bootstrap template defines Go backend layout requirements for Modes B and C.

## Decision

Skip Go backend layout in v1 because ADR 0001 selects Mode A. There is no `cmd/`, `internal/`, `pkg/`, `api/`, `configs/`, or Go runtime service.

## Consequences

- No Go dependencies, Dockerfile, migrations, or server health endpoints are present.
- If a future release adds batch data generation or runtime APIs, this ADR will be superseded.

## Alternatives Considered

- Add empty Go directories: rejected because they would imply a backend that does not exist.
