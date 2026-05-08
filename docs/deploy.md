# Deploy

Live GitHub Pages URL:

https://baditaflorin.github.io/mastering-studio-wasm/

Repository:

https://github.com/baditaflorin/mastering-studio-wasm

## Publishing

The project publishes from the `main` branch `/docs` folder. Run:

```bash
make build
git add docs
git commit -m "build: publish pages"
git push
```

GitHub Pages rebuilds from the committed `docs/` directory.

## Rollback

Revert the publishing commit and push `main`:

```bash
git revert <commit_sha>
git push
```

## Custom Domain

No custom domain is configured in v1. To add one later, create `docs/CNAME` containing the domain name, configure DNS with GitHub Pages records, then update ADR 0010.
