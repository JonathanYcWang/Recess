#!/usr/bin/env sh
# Architecture drift check for Recess.
#
# WARN ONLY. Always exits 0. Findings go to stdout as `file:line - rule - detail`
# so both the pre-commit hook and the Claude PreToolUse hook can surface them.
#
# Usage:
#   check-architecture.sh            # staged files only, or all of src/ if nothing staged
#   check-architecture.sh --all      # whole src/ tree
#   check-architecture.sh <paths...> # specific paths
#
# Rules are the mechanical half of docs/architecture.md "Layer contracts".
# The architectural half (business logic placement, single-writer invariants,
# data-flow direction) needs judgment - use /check-architecture for that.

set -u

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT" || exit 0

# Resolve the file set to inspect.
FILES=""
if [ "${1:-}" = "--all" ]; then
  FILES=$(find src -type f \( -name '*.ts' -o -name '*.tsx' \) ! -name '*.test.*' ! -name '*.spec.*' 2>/dev/null)
elif [ "$#" -gt 0 ]; then
  FILES="$*"
else
  FILES=$(git diff --staged --name-only --diff-filter=ACM 2>/dev/null | grep -E '\.tsx?$')
  [ -z "$FILES" ] && FILES=$(git diff --name-only --diff-filter=ACM 2>/dev/null | grep -E '\.tsx?$')
  [ -z "$FILES" ] && exit 0
fi

[ -z "$FILES" ] && exit 0

BROWSER_OK='src/Background/Adapters/|src/Background/Repositories/|src/Shared/ActionBrokers/'
FOUND=0

report() {
  # $1 = the grep output line, $2 = rule text
  [ -z "$1" ] && return
  FOUND=1
  printf '  %s\n' "$1"
  printf '      violates: %s\n' "$2"
}

echo ""
echo "Architecture check (advisory - does not block commit)"
echo "Scanning $(echo "$FILES" | wc -l | tr -d ' ') file(s)"
echo ""

# 1. chrome.* outside the permitted directories
out=$(echo "$FILES" | grep -vE "$BROWSER_OK" | xargs grep -n '\bchrome\.' 2>/dev/null)
report "$out" "all browser APIs use browser.*, never chrome.* (rule: rules/code-style.md)"

# 2. storage writes outside /Background/Repositories
out=$(echo "$FILES" | grep -v '^src/Background/Repositories/' | xargs grep -n 'storage\.\(local\|sync\|session\)\.\(set\|remove\|clear\)' 2>/dev/null)
report "$out" "StorageRepository is the only writer to browser storage"

# 3. UI importing from Background
out=$(echo "$FILES" | grep '^src/UI/' | xargs grep -n "from ['\"].*\.\./Background/\|from ['\"].*Background/" 2>/dev/null)
report "$out" "state flows one direction only; UI must not import Background"

# 4. Shared importing from UI or Background
out=$(echo "$FILES" | grep '^src/Shared/' | xargs grep -n "from ['\"].*\.\./\(UI\|Background\)/\|from ['\"].*/\(UI\|Background\)/" 2>/dev/null)
report "$out" "/Shared must not depend on /UI or /Background"

# 5. any / unknown / as casts
#    `as` in an import/export alias is a rename, not a cast - exclude those.
out=$(echo "$FILES" | xargs grep -nE ':\s*any\b|<any>|as unknown\b|\bas [A-Z][A-Za-z]*\b' 2>/dev/null \
  | grep -v '\.d\.ts:' \
  | grep -vE ':[0-9]+:import ' \
  | grep -vE ':[0-9]+:export \{' \
  | grep -vE ':[0-9]+:\s*(import|export)\b')
report "$out" "no any, unknown, or as casts - use type guards at boundaries"

# 6. classes and function declarations
out=$(echo "$FILES" | xargs grep -nE '^\s*(export\s+)?(abstract\s+)?class\s+|^\s*(export\s+)?(async\s+)?function\s+' 2>/dev/null)
report "$out" "plain arrow functions only - no classes, no function declarations"

if [ "$FOUND" = "1" ]; then
  echo ""
  echo "Advisory only - commit proceeds. Fix before merging."
  echo "For the architectural half (business logic placement, data-flow"
  echo "direction), run /check-architecture."
else
  echo "  No mechanical violations found."
fi
echo ""

exit 0