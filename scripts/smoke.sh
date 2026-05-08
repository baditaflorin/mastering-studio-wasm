#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
PREVIEW_ROOT="$ROOT/.tmp/smoke-pages"
APP_ROOT="$PREVIEW_ROOT/mastering-studio-wasm"
PORT="${PORT:-4173}"
PID=""

cleanup() {
  if [ -n "$PID" ]; then
    kill "$PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

cd "$ROOT"
npm run build

rm -rf "$PREVIEW_ROOT"
mkdir -p "$PREVIEW_ROOT"
ln -s "$ROOT/docs" "$APP_ROOT"

cd "$PREVIEW_ROOT"
python3 -m http.server "$PORT" --bind 127.0.0.1 >/tmp/mastering-studio-wasm-smoke.log 2>&1 &
PID="$!"

for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "http://127.0.0.1:$PORT/mastering-studio-wasm/" >/dev/null; then
    break
  fi
  sleep 1
done

cd "$ROOT"
PLAYWRIGHT_USE_EXTERNAL_SERVER=1 BASE_URL="http://127.0.0.1:$PORT/mastering-studio-wasm/" npm run test:e2e
