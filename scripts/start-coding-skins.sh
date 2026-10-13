#!/usr/bin/env bash
# Reuse the upstream authenticated local stack; isolate fork runtime state.
set -euo pipefail
skin_root="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$skin_root/.runtime/bin:$PATH"
for skin_command in node npm uvx; do
  if ! command -v "$skin_command" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n' "$skin_command" >&2
    exit 1
  fi
done
mkdir -p "$skin_root/.runtime/state"
export OH_CANVAS_SAFE_STATE_DIR="$skin_root/.runtime/state"
export OH_SESSION_API_KEY_PATH="$skin_root/.runtime/state/session-api-key.txt"
export OH_SECRET_KEY_PATH="$skin_root/.runtime/state/secret-key.txt"
export UV_CACHE_DIR="$skin_root/.runtime/uv-cache"
export VITE_MOCK_API=false
cd "$skin_root"
exec node scripts/dev-static.mjs --host 127.0.0.1 --port 8000 "$@"
