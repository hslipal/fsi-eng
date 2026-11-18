#!/usr/bin/env bash
# Tests for the tests: inject typical AI-generated mistakes one at a time and assert that the
# intended guardrail rejects each one with the expected message. If someone (or some agent)
# silently weakens a rule, this script fails.
#
#   scripts/guardrail-selftest.sh            content + frontend + backend
#   scripts/guardrail-selftest.sh frontend   one group: content | frontend | backend
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FE="$ROOT/frontend"
BE="$ROOT/backend"
BE_PKG="$BE/src/main/java/com/fsieng/content"
SCOPE="${1:-all}"
CREATED=()
PASS=0
FAIL=0

cleanup() { for f in "${CREATED[@]}"; do rm -f "$f"; done; CREATED=(); }
trap cleanup EXIT

# expect_caught <name> <file> <content> <workdir> <command> <expected-regex>
expect_caught() {
  local name="$1" file="$2" content="$3" dir="$4" cmd="$5" expected="$6" out
  mkdir -p "$(dirname "$file")"
  printf '%s\n' "$content" > "$file"
  CREATED+=("$file")
  out="$(cd "$dir" && bash -c "$cmd" 2>&1)"
  local status=$?
  cleanup
  if [[ $status -ne 0 ]] && grep -qE -- "$expected" <<<"$out"; then
    printf '  \033[32m✔ caught\033[0m  %s\n' "$name"; PASS=$((PASS + 1))
  else
    printf '  \033[31m✖ MISSED\033[0m  %s (exit=%s, expected /%s/)\n' "$name" "$status" "$expected"
    tail -n 15 <<<"$out" | sed 's/^/      /'
    FAIL=$((FAIL + 1))
  fi
}

content_cases() {
  echo "Content guardrails"
  local check="node scripts/content-check.mjs"
  local ok='"id": "3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90", "track": "ielts", "title": "t", "level": "6.5"'

  expect_caught "copyrighted dev-only material placed in content/" "$ROOT/content/aiBad.json" \
    "{ $ok, \"source\": { \"url\": \"https://example.com/x\" }, \"license\": { \"kind\": \"dev-only\" }, \"reviewed_by\": \"admin\" }" \
    "$ROOT" "$check" "license-not-publishable"

  expect_caught "Cambridge past paper passed off as public domain" "$ROOT/content/aiBad.json" \
    "{ $ok, \"source\": { \"url\": \"https://www.cambridge.org/ielts/test-1\" }, \"license\": { \"kind\": \"public-domain-us-gov\" }, \"reviewed_by\": \"admin\" }" \
    "$ROOT" "$check" "banned-source"

  expect_caught "item without reviewer" "$ROOT/content/aiBad.json" \
    "{ $ok, \"source\": { \"generator\": \"deepseek\" }, \"license\": { \"kind\": \"generated\" } }" \
    "$ROOT" "$check" "missing-field:reviewed_by"

  expect_caught "reviewer is not an admin" "$ROOT/content/aiBad.json" \
    "{ $ok, \"source\": { \"generator\": \"deepseek\" }, \"license\": { \"kind\": \"generated\" }, \"reviewed_by\": \"claude\" }" \
    "$ROOT" "$check" "reviewer-not-admin"

  expect_caught "draft that claims to be reviewed" "$ROOT/content/_drafts/aiBad.json" \
    "{ $ok, \"source\": { \"generator\": \"claude\" }, \"license\": { \"kind\": \"generated\" }, \"reviewed_by\": \"admin\" }" \
    "$ROOT" "$check" "draft-has-reviewer"

  expect_caught "drill item without an answer" "$ROOT/content/aiBad.json" \
    "{ $ok, \"source\": { \"generator\": \"claude\" }, \"license\": { \"kind\": \"generated\" }, \"reviewed_by\": \"admin\", \"drills\": [{ \"type\": \"substitution\", \"instruction\": \"Replace it.\", \"items\": [{ \"cue\": \"contract\", \"answers\": [] }] }] }" \
    "$ROOT" "$check" "invalid-drill"

  expect_caught "reading answer that is not one of the options" "$ROOT/content/aiBad.json" \
    "{ $ok, \"source\": { \"generator\": \"claude\" }, \"license\": { \"kind\": \"generated\" }, \"reviewed_by\": \"admin\", \"drills\": [{ \"type\": \"reading\", \"instruction\": \"Choose.\", \"passage\": \"Text.\", \"items\": [{ \"cue\": \"q\", \"options\": [\"TRUE\", \"FALSE\"], \"answers\": [\"MAYBE\"] }] }] }" \
    "$ROOT" "$check" "invalid-drill"

  if git -C "$ROOT" rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    local f="docs/aiBadDevOnly.json"
    expect_caught "dev-only file committed to Git" "$ROOT/$f" \
      '{ "license": { "kind": "dev-only" } }' \
      "$ROOT" "git add -N $f && $check; s=\$?; git rm -q --cached $f; exit \$s" \
      "dev-only-content-tracked"
  else
    echo "  - skipped  dev-only file committed to Git (not a git repository)"
  fi
}

frontend_cases() {
  echo "Frontend guardrails"
  local bad="$FE/src/features/library/model/aiBad.ts"
  local badUi="$FE/src/features/library/ui/AiBad.tsx"
  local lint="npx eslint --max-warnings=0"

  expect_caught "explicit any" "$bad" \
    'export function parse(x: any): string { return String(x); }' \
    "$FE" "$lint $bad" "no-explicit-any"

  expect_caught "type assertion instead of runtime validation" "$bad" \
    'import type { ContentItem } from "./contentItem";
export function toItem(json: unknown): ContentItem { return json as ContentItem; }' \
    "$FE" "$lint $bad" "consistent-type-assertions"

  expect_caught "unchecked array index (noUncheckedIndexedAccess)" "$bad" \
    'export function firstTitle(titles: string[]): number { return titles[0].length; }' \
    "$FE" "npm run -s typecheck" "possibly 'undefined'"

  expect_caught "floating promise (missing await)" "$bad" \
    'async function save(): Promise<void> { await Promise.resolve(); }
export function onClick(): void { save(); }' \
    "$FE" "$lint $bad" "no-floating-promises"

  expect_caught "banned library (axios)" "$bad" \
    'import axios from "axios";
export const client = axios;' \
    "$FE" "$lint $bad" "Use shared/api/httpClient"

  expect_caught "frontend calls a model SDK directly" "$bad" \
    'import OpenAI from "openai";
export const client = OpenAI;' \
    "$FE" "$lint $bad" "The frontend never calls a model"

  expect_caught "raw fetch() outside httpClient" "$bad" \
    'export async function load(): Promise<Response> { return await fetch("/api/content/items"); }' \
    "$FE" "$lint $bad" "Raw fetch\\(\\) is only allowed"

  expect_caught "UI component calls API layer directly" "$badUi" \
    'import type { ReactElement } from "react";
import { fetchPublishedItems } from "../api/contentApi";
export function AiBad(): ReactElement { void fetchPublishedItems("it"); return <p />; }' \
    "$FE" "npm run -s arch" "ui-does-not-call-api-directly"

  expect_caught "shared/ depends on a feature" "$FE/src/shared/aiBad.ts" \
    'import { LibraryPanel } from "@/features/library";
export const x = LibraryPanel;' \
    "$FE" "npm run -s arch" "shared-is-leaf"

  expect_caught "enum instead of union type" "$bad" \
    'export enum Color { Red = "RED" }' \
    "$FE" "npm run -s typecheck" "erasableSyntaxOnly|TS1294"

  expect_caught "dead file left behind (orphan)" "$FE/src/shared/aiOrphan.ts" \
    'export const unused = 1;' \
    "$FE" "npm run -s arch" "no-orphans"
}

backend_cases() {
  echo "Backend guardrails"
  local mvn="$ROOT/scripts/mvn.sh -B -ntp -q -Dspotless.check.skip=true -Denforcer.skip=true"
  local arch="$mvn test -Dtest=ArchitectureTest -Dsurefire.failIfNoSpecifiedTests=false -Djacoco.skip=true"

  expect_caught "controller bypasses use-case port (injects port.out)" \
    "$BE_PKG/adapter/in/web/AiBadController.java" \
    'package com.fsieng.content.adapter.in.web;

import com.fsieng.content.application.port.out.LoadContentPort;
import com.fsieng.content.domain.Track;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AiBadController {
  private final LoadContentPort port;

  public AiBadController(LoadContentPort port) {
    this.port = port;
  }

  public int count() {
    return port.loadByTrack(Track.IT).size();
  }
}' "$BE" "$arch" "web_uses_input_ports_only"

  expect_caught "Spring annotation leaks into domain" \
    "$BE_PKG/domain/AiBadDomainService.java" \
    'package com.fsieng.content.domain;

@org.springframework.stereotype.Component
public class AiBadDomainService {}' "$BE" "$arch" "core_is_framework_free"

  expect_caught "JPA entity in the domain" \
    "$BE_PKG/domain/AiBadEntity.java" \
    'package com.fsieng.content.domain;

@jakarta.persistence.Entity
public class AiBadEntity {
  @jakarta.persistence.Id private long id;

  public long id() {
    return id;
  }
}' "$BE" "$arch" "entities_only_in_persistence"

  expect_caught "service calls DeepSeek over HTTP directly" \
    "$BE_PKG/application/service/AiBadScorer.java" \
    'package com.fsieng.content.application.service;

import java.net.http.HttpClient;

public final class AiBadScorer {
  private final HttpClient http = HttpClient.newHttpClient();

  public String version() {
    return http.version().name();
  }
}' "$BE" "$arch" "llm_only_in_llm_adapter"

  expect_caught "reads system time instead of injected Clock" \
    "$BE_PKG/application/service/AiBadTimer.java" \
    'package com.fsieng.content.application.service;

import java.time.Instant;

public final class AiBadTimer {
  public Instant stamp() {
    return Instant.now();
  }
}' "$BE" "$arch" "no_system_time"

  expect_caught "returns null from non-null method (NullAway)" \
    "$BE_PKG/domain/AiBadNull.java" \
    'package com.fsieng.content.domain;

public final class AiBadNull {
  public String find(boolean present) {
    return present ? "x" : null;
  }
}' "$BE" "$mvn compile" "\\[NullAway\\]"

  expect_caught "throws generic RuntimeException" \
    "$BE_PKG/application/service/AiBadThrower.java" \
    'package com.fsieng.content.application.service;

public final class AiBadThrower {
  public void fail() {
    throw new RuntimeException("boom");
  }
}' "$BE" "$arch" "generic exceptions"
}

case "$SCOPE" in
  content) content_cases ;;
  frontend) frontend_cases ;;
  backend) backend_cases ;;
  all) content_cases; frontend_cases; backend_cases ;;
  *) echo "usage: $0 [all|content|frontend|backend]" >&2; exit 2 ;;
esac

echo
echo "guardrail self-test: $PASS caught, $FAIL missed"
[[ $FAIL -eq 0 ]]
