#!/usr/bin/env sh
set -eu

if [ "${1:-}" = "--staged" ]; then
  FILES="$(git diff --cached --name-only --diff-filter=ACMR)"
else
  FILES="$(git ls-files)"
fi

if [ -z "$FILES" ]; then
  exit 0
fi

PATTERN='(BEGIN (RSA |DSA |EC |OPENSSH |PGP )?PRIVATE KEY|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9_]{36}|gho_[A-Za-z0-9_]{36}|xox[baprs]-[A-Za-z0-9-]{10,}|api[_-]?key[=:][^[:space:]]+)'

FOUND=0
for file in $FILES; do
  [ -f "$file" ] || continue
  case "$file" in
    package-lock.json|docs/assets/*|docs/vendor/*|public/vendor/*)
      continue
      ;;
  esac
  if grep -E -i "$PATTERN" "$file" >/dev/null 2>&1; then
    echo "Potential secret found in $file"
    FOUND=1
  fi
done

exit "$FOUND"
