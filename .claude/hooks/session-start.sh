#!/bin/bash
set -euo pipefail

# Install pre-push git hook from the tracked copy in scripts/hooks/
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"
cp scripts/hooks/pre-push .git/hooks/pre-push
chmod +x .git/hooks/pre-push
echo "✅ Git pre-push hook installed."
