#!/usr/bin/env bash
# Google subscription login stays in Google's official CLI, outside the UI.
set -euo pipefail
skin_root="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$skin_root/.runtime/bin:$PATH"
if ! command -v node >/dev/null 2>&1; then
  echo 'Node 24+ is required.' >&2
  exit 1
fi
if [ ! -x "$skin_root/.runtime/antigravity/agy_acp_server.par" ]; then
  echo 'Install Google’s official Antigravity ACP runtime first. See docs/open-skins/agents.md.' >&2
  exit 1
fi
exec node "$skin_root/scripts/providers/google/login.mjs"
