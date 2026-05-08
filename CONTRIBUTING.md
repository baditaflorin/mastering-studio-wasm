# Contributing

Thanks for helping improve `mastering-studio-wasm`.

## Local Setup

```bash
npm install
make install-hooks
make dev
```

## Commit Style

Use Conventional Commits:

```text
feat: add mastering preview controls
fix: prevent clipping on hot exports
docs: update deployment guide
```

## Checks

Run these before pushing:

```bash
make fmt
make lint
make test
make build
make smoke
```

Do not commit secrets, real `.env` files, private keys, or generated scratch artifacts.
