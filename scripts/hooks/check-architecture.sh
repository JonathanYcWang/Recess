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

# grep over the file list with -H so every hit is prefixed path:line even
# when only one file matches. `$FILES` is whitespace-separated paths.
g() {
  # $1 = extended-regex flag (optional), $2 = pattern
  if [ "${1:-}" = "-E" ]; then
    shift
    # shellcheck disable=SC2086
    grep -HnE "$@" $FILES 2>/dev/null
  else
    # shellcheck disable=SC2086
    grep -Hn "$@" $FILES 2>/dev/null
  fi
}

# Same, but only over files whose path does NOT match the filter regex.
# Filtering is done in the shell, not with `grep -v`: some grep
# implementations (ugrep) apply -v to file contents rather than to the
# argument list, which silently corrupts the file list.
gf() {
  _gf_list=""
  for _f in $FILES; do
    echo "$_f" | grep -qE "$1" || _gf_list="$_gf_list $_f"
  done
  [ -z "$_gf_list" ] && return
  # shellcheck disable=SC2086
  grep -Hn "$2" $_gf_list 2>/dev/null
}

# Inverse of gf: only over files whose path DOES match the filter regex.
gi() {
  _gi_list=""
  for _f in $FILES; do
    echo "$_f" | grep -qE "$1" && _gi_list="$_gi_list $_f"
  done
  [ -z "$_gi_list" ] && return
  # shellcheck disable=SC2086
  grep -Hn "$2" $_gi_list 2>/dev/null
}

echo ""
echo "Architecture check (advisory - does not block commit)"
echo "Scanning $(echo "$FILES" | wc -l | tr -d ' ') file(s)"
echo ""

# 1. chrome.* outside the permitted directories
out=$(gf "$BROWSER_OK" '\bchrome\.')
report "$out" "all browser APIs use browser.*, never chrome.* (rule: rules/code-style.md)"

# 2. storage writes outside /Background/Repositories
out=$(gf '^src/Background/Repositories/' 'storage\.\(local\|sync\|session\)\.\(set\|remove\|clear\)')
report "$out" "StorageRepository is the only writer to browser storage"

# 3. UI importing from Background
#    Match only cross-layer paths: relative '../Background/' or the '@/Background/'
#    alias. A bare '.*Background/' also matches Background's own internal
#    imports, which are legal.
out=$(gi '^src/UI/' "from ['\"].*\.\./Background/\|from ['\"]@/Background/")
report "$out" "state flows one direction only; UI must not import Background"

# 4. Shared importing from UI or Background
out=$(gi '^src/Shared/' "from ['\"].*\.\./\(UI\|Background\)/\|from ['\"]@/\(UI\|Background\)/")
report "$out" "/Shared must not depend on /UI or /Background"

# 5. any / unknown / as casts
#    `as` in an import/export alias is a rename, not a cast - exclude those.
out=$(g -E ':\s*any\b|<any>|as unknown\b|\bas [A-Z][A-Za-z]*\b' \
  | grep -v '\.d\.ts:' \
  | grep -vE ':[0-9]+:import ' \
  | grep -vE ':[0-9]+:export \{' \
  | grep -vE ':[0-9]+:\s*(import|export)\b')
report "$out" "no any, unknown, or as casts - use type guards at boundaries"

# 6. classes and function declarations
out=$(g -E '^\s*(export\s+)?(abstract\s+)?class\s+|^\s*(export\s+)?(async\s+)?function\s+')
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