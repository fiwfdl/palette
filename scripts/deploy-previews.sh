#!/usr/bin/env bash
# Deploy a Cloudflare Pages preview for every origin branch whose head commit is
# not yet deployed.
#
# Why this exists: `entrypoint-template-web` is a Direct Upload Pages project, so
# Cloudflare Git integration cannot be enabled on it, and GitHub Actions is not
# the only trigger in every environment. A Paperclip scheduled routine runs this
# script so a pushed commit still produces an automatic preview without a manual
# command.
#
# Requires: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, GITHUB_TOKEN.
set -euo pipefail

: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID is required}"
: "${GITHUB_TOKEN:?GITHUB_TOKEN is required}"

PROJECT="${PAGES_PROJECT:-entrypoint-template-web}"
PRODUCTION_BRANCH="${PRODUCTION_BRANCH:-main}"
REPO_SLUG="${REPO_SLUG:-fiwfdl/entrypoint-template-web}"
CF_API="https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${PROJECT}"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

echo "Cloning ${REPO_SLUG}..."
git clone --quiet "https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO_SLUG}.git" "$work/repo"
cd "$work/repo"
git fetch --quiet origin '+refs/heads/*:refs/remotes/origin/*'

echo "Reading deployed commits from Cloudflare Pages..."
deployed="$work/deployed.txt"
: > "$deployed"
page=1
while :; do
  body="$(curl -fsS -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" "${CF_API}/deployments?per_page=25&page=${page}")"
  printf '%s' "$body" | python3 -c '
import json, sys
for dep in json.load(sys.stdin).get("result") or []:
    meta = (dep.get("deployment_trigger") or {}).get("metadata") or {}
    branch, commit = meta.get("branch") or "", meta.get("commit_hash") or ""
    if branch and commit:
        print(f"{branch} {commit}")
' >> "$deployed"
  total_pages="$(printf '%s' "$body" | python3 -c 'import json, sys; print((json.load(sys.stdin).get("result_info") or {}).get("total_pages") or 1)')"
  page=$((page + 1))
  [ "$page" -gt "$total_pages" ] && break
done

deployed_count=0
for branch in $(git for-each-ref --format='%(refname:strip=3)' refs/remotes/origin | grep -v '^HEAD$'); do
  if [ "$branch" = "$PRODUCTION_BRANCH" ]; then
    echo "skip $branch (production branch is deployed manually)"
    continue
  fi
  sha="$(git rev-parse "origin/${branch}")"
  if grep -qxF "${branch} ${sha}" "$deployed"; then
    echo "skip $branch @ ${sha:0:8} (already deployed)"
    continue
  fi
  echo "==> deploying $branch @ ${sha:0:8}"
  git checkout --quiet -B "autodeploy/${branch}" "origin/${branch}"
  npm ci --no-audit --no-fund >/dev/null
  npm run build
  npx --yes wrangler@4 pages deploy dist \
    --project-name "$PROJECT" \
    --branch "$branch" \
    --commit-hash "$sha" \
    --commit-message "preview ${sha}"
  deployed_count=$((deployed_count + 1))
done

echo "Done. Deployed ${deployed_count} branch(es)."
