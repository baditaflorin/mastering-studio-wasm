#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
PREVIEW_ROOT="$ROOT/.tmp/smoke-pages"
APP_ROOT="$PREVIEW_ROOT/mastering-studio-wasm"
PORT="${PORT:-}"
PID=""

cleanup() {
  if [ -n "$PID" ]; then
    kill "$PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

cd "$ROOT"
make build VERSION="${VERSION:-0.1.0}" COMMIT="${COMMIT:-dev}"

rm -rf "$PREVIEW_ROOT"
mkdir -p "$PREVIEW_ROOT"
ln -s "$ROOT/docs" "$APP_ROOT"

if [ -z "$PORT" ]; then
  for candidate in 4173 4181 4182 4183 4184 4185 4186 4187 4188 4189; do
    if ! lsof -ti "tcp:$candidate" >/dev/null 2>&1; then
      PORT="$candidate"
      break
    fi
  done
fi

if [ -z "$PORT" ]; then
  echo "No free smoke-test port found."
  exit 1
fi

node "$ROOT/scripts/serve-static.mjs" "$PREVIEW_ROOT" "$PORT" 127.0.0.1 >/tmp/mastering-studio-wasm-smoke.log 2>&1 &
PID="$!"

for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if ! kill -0 "$PID" 2>/dev/null; then
    cat /tmp/mastering-studio-wasm-smoke.log
    echo "Static preview server exited before smoke tests could start."
    exit 1
  fi
  if curl -fsS "http://127.0.0.1:$PORT/mastering-studio-wasm/" >/dev/null; then
    break
  fi
  sleep 1
done

cd "$ROOT"
PLAYWRIGHT_USE_EXTERNAL_SERVER=1 BASE_URL="http://127.0.0.1:$PORT/mastering-studio-wasm/" npm run test:e2e
