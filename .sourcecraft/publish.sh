#!/usr/bin/env bash
set -euo pipefail

SITE_DIR="site"
RELEASE_BRANCH="release"
COMMIT_MSG="Publish SourceCraft Site $(date -u +%Y-%m-%dT%H:%M:%SZ)"

test -s "$SITE_DIR/index.html" || {
  echo "ERROR: site/index.html is missing." >&2
  exit 1
}

# Preserve generated site before switching worktree.
STAGE_DIR="$(mktemp -d)"
cp -a "$SITE_DIR" "$STAGE_DIR/site"

git config user.email "ci@sourcecraft.local"
git config user.name "SourceCraft CI"
git fetch origin "$RELEASE_BRANCH" 2>/dev/null || true

WT="$(mktemp -d)"
cleanup() {
  git worktree remove --force "$WT" >/dev/null 2>&1 || true
  rm -rf "$WT" "$STAGE_DIR"
}
trap cleanup EXIT

if git show-ref --verify --quiet "refs/remotes/origin/$RELEASE_BRANCH"; then
  git worktree add --force "$WT" "origin/$RELEASE_BRANCH"
  (cd "$WT" && git checkout -B "$RELEASE_BRANCH" "origin/$RELEASE_BRANCH")
else
  git worktree add --force --detach "$WT"
  (cd "$WT" && git checkout --orphan "$RELEASE_BRANCH" && git rm -rf . >/dev/null 2>&1 || true)
fi

# SourceCraft Sites is configured with root: site, so release MUST contain site/index.html.
find "$WT" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
cp -a "$STAGE_DIR/site" "$WT/site"
touch "$WT/site/.nojekyll"

test -s "$WT/site/index.html"
test -s "$WT/site/assets/css/style.css"
test -s "$WT/site/assets/js/site.js"
test -s "$WT/site/assets/js/learning-deck.js"
test -s "$WT/site/labs/lx2.html"

if (cd "$WT" && git status --porcelain | grep -q .); then
  (cd "$WT" && git add -A && git commit -m "$COMMIT_MSG")
  (cd "$WT" && git push origin "$RELEASE_BRANCH" --force)
else
  echo "No generated-site changes to publish."
fi

echo "Published. SourceCraft Sites expects: release/site/index.html"
