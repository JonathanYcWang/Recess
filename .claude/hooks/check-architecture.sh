#!/usr/bin/env sh
# PreToolUse hook. Fires before `git commit`, reports architecture drift.
#
# The mechanical scan lives in scripts/hooks/check-architecture.sh so the
# committed pre-commit hook and this hook share one implementation. This
# wrapper only decides whether this particular command is a commit.

INPUT=$(cat)

# Only run for actual commit invocations.
echo "$INPUT" | grep -q '"command"[[:space:]]*:[[:space:]]*"[^"]*git commit' || exit 0

# CLAUDE_PROJECT_DIR is set by Claude Code. Fall back to the repo root derived
# from this script's own location so the hook also works when invoked directly.
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
SCRIPT="$ROOT/scripts/hooks/check-architecture.sh"

if [ ! -x "$SCRIPT" ]; then
  echo "Architecture check skipped: $SCRIPT not found or not executable."
  exit 0
fi

"$SCRIPT" || true

exit 0