#!/usr/bin/env sh
# PreToolUse hook. Fires before `git commit`, reports architecture drift.
# NEVER BLOCKS - always exits 0, per the plan's Q10 decision.
#
# The mechanical scan lives in scripts/hooks/check-architecture.sh so the
# committed pre-commit hook and this hook share one implementation. This
# wrapper only decides whether this particular command is a commit.

set -u

INPUT=$(cat)

# Only run for actual commit invocations.
echo "$INPUT" | grep -q '"command"[[:space:]]*:[[:space:]]*"[^"]*git commit' || exit 0

SCRIPT="$CLAUDE_PROJECT_DIR/scripts/hooks/check-architecture.sh"
[ -x "$SCRIPT" ] || exit 0

"$SCRIPT" || true

exit 0