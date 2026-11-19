#!/usr/bin/env bash
# Tamper detection for the guardrails themselves.
#
# The most common way an AI agent "fixes" a failing build is to relax the rule that failed.
# guardrails.lock pins a SHA-256 of every rule-defining file. CI fails if any of them
# changed without the lock being regenerated — and the lock is CODEOWNERS-protected, so
# regenerating it requires a human platform-team review.
#
#   scripts/guardrails-lock.sh check    verify (CI)
#   scripts/guardrails-lock.sh update   regenerate after an intentional, reviewed change
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCK="$ROOT/guardrails.lock"

PROTECTED=(
  AGENTS.md
  CLAUDE.md
  frontend/AGENTS.md
  backend/AGENTS.md
  .gitattributes
  .github/workflows/ci.yml
  .github/workflows/claude-task.yml
  .github/workflows/deepseek-smoke.yml
  .github/CODEOWNERS
  content-policy.json
  scripts/verify.sh
  scripts/mvn.sh
  docker-compose.yml
  scripts/guardrails-lock.sh
  scripts/guardrail-selftest.sh
  scripts/content-check.mjs
  frontend/eslint.config.js
  frontend/.dependency-cruiser.cjs
  frontend/tsconfig.json
  frontend/tsconfig.app.json
  frontend/tsconfig.node.json
  frontend/vite.config.ts
  frontend/playwright.config.ts
  frontend/.prettierrc.json
  backend/pom.xml
  backend/.mvn/jvm.config
  backend/src/test/java/com/fsieng/architecture/ArchitectureTest.java
)

# Every file in these folders is protected too (e.g. each scoring prompt).
PROTECTED_DIRS=(
  prompts/scoring
)

hash_all() {
  (cd "$ROOT" && for f in "${PROTECTED[@]}"; do
    [[ -f "$f" ]] || { echo "missing protected file: $f" >&2; exit 1; }
    sha256sum "$f"
  done
  for d in "${PROTECTED_DIRS[@]}"; do
    find "$d" -type f | LC_ALL=C sort | while read -r f; do sha256sum "$f"; done
  done)
}

case "${1:-check}" in
  update)
    hash_all > "$LOCK"
    echo "guardrails.lock updated ($(wc -l < "$LOCK" | tr -d " ") files). Commit it in a reviewed PR."
    ;;
  check)
    [[ -f "$LOCK" ]] || { echo "guardrails.lock missing — run: scripts/guardrails-lock.sh update" >&2; exit 1; }
    if ! diff -u "$LOCK" <(hash_all); then
      echo "✖ Guardrail files changed without updating guardrails.lock." >&2
      echo "  If this change is intentional, run 'scripts/guardrails-lock.sh update' and get" >&2
      echo "  a CODEOWNERS (platform team) approval. AI agents must not do this on their own." >&2
      exit 1
    fi
    echo "✔ $(wc -l < "$LOCK" | tr -d " ") guardrail files match guardrails.lock"
    ;;
  *) echo "usage: $0 [check|update]" >&2; exit 2 ;;
esac
