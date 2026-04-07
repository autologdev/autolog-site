#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
git add -A
if git diff --cached --quiet; then
  echo "Nothing new to commit."
else
  git commit -m "Overhaul auth — dark premium login/signup/magic/reset"
fi
git push origin main
echo ""
echo "✅ Deployed. Live in ~60s at https://www.autologapp.co.uk"
