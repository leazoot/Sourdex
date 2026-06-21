#!/usr/bin/env bash
# Assemble Sourdex v0.1 release artifacts into dist-release/ (TASK-049).
#
# Produces the user-facing install artifacts:
#   - the browser extension zip (load-unpacked / store upload)
#   - a static web UI bundle tarball
# The local service is run from source per the README (`pnpm --filter @sourdex/server start`);
# bundling a self-contained server with native better-sqlite3 is out of scope for v0.1.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist-release"

rm -rf "$OUT"
mkdir -p "$OUT"

echo "▸ Building workspace…"
pnpm build

echo "▸ Zipping browser extension…"
pnpm --filter @sourdex/extension zip
cp "$ROOT"/apps/extension/.output/*-chrome.zip "$OUT/"

echo "▸ Packaging web UI bundle…"
tar -czf "$OUT/sourdex-web.tar.gz" -C "$ROOT/apps/web" dist

echo "✔ Release artifacts in $OUT:"
ls -lh "$OUT"
