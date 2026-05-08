#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
PREVIEW_ROOT="$ROOT/.tmp/pages-preview"
APP_ROOT="$PREVIEW_ROOT/mastering-studio-wasm"
PORT="${PORT:-4173}"

rm -rf "$PREVIEW_ROOT"
mkdir -p "$PREVIEW_ROOT"
ln -s "$ROOT/docs" "$APP_ROOT"

printf 'Serving %s at http://127.0.0.1:%s/mastering-studio-wasm/\n' "$APP_ROOT" "$PORT"
cd "$PREVIEW_ROOT"
python3 -m http.server "$PORT" --bind 127.0.0.1
