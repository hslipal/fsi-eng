#!/usr/bin/env bash
# Single entry point for humans, AI agents and CI. Same checks, same order, everywhere.
#   ./scripts/verify.sh               all (guardrails → content → backend → frontend → e2e)
#   ./scripts/verify.sh frontend      one stage: guardrails | content | backend | frontend | e2e
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAGE="${1:-all}"

step() { printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }

run_guardrails() {
  step "Guardrail integrity (protected config files unchanged)"
  "$ROOT/scripts/guardrails-lock.sh" check

  step "Forbidden escape hatches in source"
  # Belt and braces: ESLint/NullAway catch most of these, this catches the rest
  # (e.g. suppression annotations that would silence the checker itself).
  local hits
  hits="$(grep -rnE \
    -e '@ts-ignore|@ts-nocheck|eslint-disable[^-]' \
    -e '@SuppressWarnings\("(all|NullAway|unchecked)"\)' \
    -e '\b(it|test|describe)\.(skip|only)\(' \
    -e '@Disabled' \
    "$ROOT/frontend/src" "$ROOT/frontend/e2e" "$ROOT/backend/src" 2>/dev/null || true)"
  if [[ -n "$hits" ]]; then
    echo "$hits"
    echo "✖ Forbidden suppression / skipped test found (see AGENTS.md §1)." >&2
    exit 1
  fi
  echo "✔ none found"
}

run_content() {
  step "Content: licensed data (schema, banned sources, admin reviewers, no dev-only in Git)"
  node "$ROOT/scripts/content-check.mjs"
}

run_backend() {
  step "Backend: enforcer → Spotless → javac -Werror + Error Prone + NullAway → JUnit + ArchUnit → JaCoCo"
  (cd "$ROOT/backend" && "$ROOT/scripts/mvn.sh" -B -ntp verify)
}

run_frontend() {
  step "Frontend: prettier → tsc (strict) → eslint → dependency-cruiser → vitest (+coverage) → build"
  (cd "$ROOT/frontend" && { [[ -d node_modules ]] || npm ci; } && npm run verify)
}

run_e2e() {
  step "E2E: Playwright"
  (cd "$ROOT/frontend" && npm run e2e)
}

case "$STAGE" in
  guardrails) run_guardrails ;;
  content) run_content ;;
  backend) run_backend ;;
  frontend) run_frontend ;;
  e2e) run_e2e ;;
  all) run_guardrails; run_content; run_backend; run_frontend; run_e2e ;;
  *) echo "unknown stage: $STAGE" >&2; exit 2 ;;
esac

printf '\n\033[1;32m✔ verify (%s) passed\033[0m\n' "$STAGE"
