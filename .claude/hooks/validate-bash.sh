#!/usr/bin/env bash
# PURPOSE: PreToolUse hook — intercepts Bash tool calls before execution and blocks
#          destructive commands that could cause irreversible data loss.
# BENEFIT:  Prevents accidental deletion of docs/index.html (the sole deployable artifact),
#           hard git resets, or force-pushes without surfacing them for human review first.
# EXAMPLE:  If Claude attempts `rm -rf docs/` or `git reset --hard HEAD~3`, this hook exits 2
#           to block the call and prints a clear explanation of what was blocked and why.
# REGISTRATION: Listed under "PreToolUse" with matcher "Bash" in .claude/settings.json

set -euo pipefail

INPUT=$(cat)

# Use python3 for JSON parsing (always available; avoids jq dependency)
TOOL=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_name', ''))
except:
    print('')
" 2>/dev/null || echo "")

COMMAND=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('command', ''))
except:
    print('')
" 2>/dev/null || echo "")

if [ "$TOOL" != "Bash" ]; then
  exit 0
fi

# Strip heredoc content (everything between <<'EOF'/<<"EOF" and EOF) before checking.
# This prevents matching dangerous pattern names mentioned in commit messages or docs.
COMMAND_TO_CHECK=$(echo "$COMMAND" | python3 -c "
import sys, re
text = sys.stdin.read()
# Remove heredoc bodies — strip from <<'EOF' or <<EOF to the closing EOF line
text = re.sub(r\"<<'?\\\"?EOF'?\\\"?.*?^EOF\", '', text, flags=re.DOTALL|re.MULTILINE)
# Also strip single and double quoted strings (multi-line) to avoid false matches in messages
# Just take the first line (the actual command invocation) for pattern matching
first_meaningful = [l.strip() for l in text.split('\n') if l.strip() and not l.strip().startswith('#')]
print('\n'.join(first_meaningful[:3]))  # check first 3 non-comment lines only
" 2>/dev/null || echo "$COMMAND")

# Patterns that warrant a block — edit this list to tune sensitivity
DANGEROUS_PATTERNS=(
  "rm -rf"
  "rm -f docs/"
  "git reset --hard"
  "git checkout -- "
  "git clean -f"
  "git push --force[^-]"
  "git push -f "
  "> docs/index.html"
  "truncate.*docs/"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND_TO_CHECK" | grep -qE "$pattern"; then
    echo "" >&2
    echo "🚫 BLOCKED — Destructive command detected" >&2
    echo "   Pattern matched : $pattern" >&2
    echo "   Full command    : $COMMAND" >&2
    echo "" >&2
    echo "   If intentional: ask the user for explicit confirmation first," >&2
    echo "   or temporarily remove the pattern from .claude/hooks/validate-bash.sh" >&2
    echo "" >&2
    exit 2
  fi
done

exit 0
