#!/usr/bin/env bash
# Google subscription login stays in Google's official CLI, outside the UI.
set -euo pipefail
skin_root="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$skin_root/.runtime/bin:$PATH"
if ! command -v gemini >/dev/null 2>&1; then
  echo 'Gemini CLI is missing. Install the official @google/gemini-cli package first.' >&2
  exit 1
fi
mkdir -p "$skin_root/.runtime/gemini-login"
cd "$skin_root/.runtime/gemini-login"
printf '%s\n' 'Choose Sign in with Google, using the account with Google AI Pro.' 'After sign-in, exit Gemini with /quit and start Coding Skins.'
exec gemini "$@"
