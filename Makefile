SHELL := /bin/sh
VERSION ?= $(shell git describe --tags --always --dirty 2>/dev/null || node -p "require('./package.json').version")
COMMIT ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo dev)

.PHONY: help install-hooks dev build data test test-integration smoke lint fmt pages-preview release clean hooks-pre-commit hooks-commit-msg hooks-pre-push

help:
	@printf '%s\n' \
		'Targets:' \
		'  make install-hooks     Wire .githooks into this clone' \
		'  make dev               Run the Vite dev server' \
		'  make build             Build the Pages-ready docs/ directory' \
		'  make data              No-op in Mode A' \
		'  make test              Run unit tests' \
		'  make test-integration  No-op in Mode A' \
		'  make smoke             Build, serve docs/, and run Playwright happy path' \
		'  make lint              Run linters, type checks, format checks, and audit' \
		'  make fmt               Autoformat source files' \
		'  make pages-preview     Serve docs/ at the GitHub Pages base path' \
		'  make release           Tag the current commit' \
		'  make clean             Remove local generated scratch artifacts'

install-hooks:
	git config core.hooksPath .githooks
	chmod +x .githooks/* scripts/*.sh

dev:
	npm run dev

build:
	VITE_APP_VERSION="$(VERSION)" VITE_GIT_COMMIT="$(COMMIT)" npm run build

data:
	@echo 'Mode A: no static data pipeline.'

test:
	npm run test

test-integration:
	@echo 'Mode A: no separate integration suite.'

smoke:
	VERSION="$(VERSION)" COMMIT="$(COMMIT)" scripts/smoke.sh

lint:
	npm run lint
	npm run typecheck
	npm run format:check
	npm run audit

fmt:
	npm run format

pages-preview:
	scripts/pages-preview.sh

release:
	@if [ -z "$(TAG)" ]; then echo 'Usage: make release TAG=v0.1.0'; exit 1; fi
	git tag "$(TAG)"
	git push origin "$(TAG)"

hooks-pre-commit:
	.githooks/pre-commit

hooks-commit-msg:
	@if [ -z "$(MSG)" ]; then echo 'Usage: make hooks-commit-msg MSG=.git/COMMIT_EDITMSG'; exit 1; fi
	.githooks/commit-msg "$(MSG)"

hooks-pre-push:
	.githooks/pre-push

clean:
	rm -rf .tmp coverage playwright-report test-results
