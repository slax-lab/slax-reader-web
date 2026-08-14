#!/usr/bin/env bash
# collect-diff.sh — normalize three input modes into a single diff blob.
#
# Usage:
#   collect-diff.sh pr <pr-number>
#   collect-diff.sh branch <branch-name>
#   collect-diff.sh local
#
# Output (to stdout, sectioned with markers):
#   === META ===
#   === FILES ===   (one path per line)
#   === DIFF ===    (unified diff)
#
# Base branch for this repo is `develop` (fork monorepo), NOT main.
# This is a convenience helper. The SKILL may also drive git/gh directly.

set -euo pipefail

MODE="${1:-local}"
ARG="${2:-}"
BASE_BRANCH="develop"

echo "=== META ==="
echo "mode: $MODE"
echo "arg: $ARG"
echo "date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "repo: $(basename "$(git rev-parse --show-toplevel 2>/dev/null || echo unknown)")"

case "$MODE" in
  pr)
    if [[ -z "$ARG" ]]; then
      echo "error: pr mode requires a PR number" >&2
      exit 1
    fi
    if ! command -v gh >/dev/null 2>&1; then
      echo "error: gh CLI required for pr mode" >&2
      exit 1
    fi

    echo "pr_title: $(gh pr view "$ARG" --json title -q .title 2>/dev/null || echo '<unknown>')"
    echo "pr_author: $(gh pr view "$ARG" --json author -q .author.login 2>/dev/null || echo '<unknown>')"
    echo "pr_base: $(gh pr view "$ARG" --json baseRefName -q .baseRefName 2>/dev/null || echo '<unknown>')"
    echo "pr_head: $(gh pr view "$ARG" --json headRefName -q .headRefName 2>/dev/null || echo '<unknown>')"

    echo "=== PR_BODY ==="
    gh pr view "$ARG" --json body -q .body 2>/dev/null || echo '<no body>'

    echo "=== FILES ==="
    gh pr diff "$ARG" --name-only 2>/dev/null || gh pr view "$ARG" --json files -q '.files[].path'

    echo "=== DIFF ==="
    gh pr diff "$ARG"
    ;;

  branch)
    if [[ -z "$ARG" ]]; then
      echo "error: branch mode requires a branch name" >&2
      exit 1
    fi

    # Base against develop (fall back to origin/develop, then main).
    BASE="$BASE_BRANCH"
    if ! git rev-parse --verify "$BASE" >/dev/null 2>&1; then
      if git rev-parse --verify "origin/$BASE_BRANCH" >/dev/null 2>&1; then
        BASE="origin/$BASE_BRANCH"
      else
        BASE="main"
      fi
    fi
    MERGE_BASE="$(git merge-base "$BASE" "$ARG")"

    echo "base: $BASE"
    echo "merge_base: $MERGE_BASE"

    echo "=== FILES ==="
    git diff --name-only "$MERGE_BASE".."$ARG"

    echo "=== DIFF ==="
    git diff "$MERGE_BASE".."$ARG"
    ;;

  local)
    echo "=== STATUS ==="
    git status --short

    echo "=== FILES ==="
    # Combine staged + unstaged + untracked into one unique list
    {
      git diff --name-only
      git diff --staged --name-only
      git ls-files --others --exclude-standard
    } | sort -u

    echo "=== DIFF (unstaged) ==="
    git diff

    echo "=== DIFF (staged) ==="
    git diff --staged
    ;;

  *)
    echo "error: unknown mode '$MODE'. Use: pr | branch | local" >&2
    exit 1
    ;;
esac
