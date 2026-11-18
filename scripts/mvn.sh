#!/usr/bin/env bash
# Maven entry point for verify.sh and the self-test.
# Uses a local `mvn` when one is installed; otherwise runs Maven + JDK 25 in Docker
# (service `maven` in docker-compose.yml). Force Docker with FSI_MAVEN_IN_DOCKER=1.
#
#   cd backend && ../scripts/mvn.sh -B verify
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if command -v mvn > /dev/null 2>&1 && [[ "${FSI_MAVEN_IN_DOCKER:-0}" != "1" ]]; then
  exec mvn "$@"
fi

if ! command -v docker > /dev/null 2>&1; then
  echo "✖ Neither mvn nor docker found. Install Docker Desktop (or JDK 25 + Maven 3.9)." >&2
  exit 1
fi

# Path of the current directory relative to the repo root, e.g. "backend".
REL="${PWD#"$ROOT"}"
REL="${REL#/}"

# Git Bash on Windows rewrites arguments that look like paths; keep /workspace as is.
export MSYS_NO_PATHCONV=1
exec docker compose -f "$ROOT/docker-compose.yml" --profile tools run --rm -T \
  -w "/workspace/${REL}" maven mvn "$@"
