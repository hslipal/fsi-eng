# FSI-Eng

An English drill system for Chinese speakers, built on FSI methods (pattern drills, dialogue
memorisation, ILR targets). Three tracks: business English, IT workplace English, IELTS.
Spec: https://claude.ai/artifact/QMkmBsAudG92ofpBb34Qmd

The repository is guardrailed: `./scripts/verify.sh` decides whether a change is done. Agents
(Claude Code) read `CLAUDE.md` → `AGENTS.md`.

## Requirements

- JDK 25 and Maven 3.9+ (backend)
- Node.js 22+ (frontend and content checks)
- Git Bash or WSL on Windows (the scripts are bash)

## First run

```bash
git init && git add -A           # the content check scans tracked files
(cd backend && mvn -B spotless:apply)   # format Java with the pinned google-java-format
./scripts/guardrails-lock.sh update     # re-pin hashes if formatting touched a protected file
(cd frontend && npm ci)
./scripts/verify.sh                     # guardrails → content → backend → frontend → e2e
./scripts/guardrail-selftest.sh         # every injected mistake must be "caught"
```

## Layout

```
backend/    Spring Boot 4 · Java 25 · Hibernate · hexagonal modules under com.fsieng
frontend/   React 19 · TypeScript strict · zod · Vitest · Playwright
content/    reviewed, publishable material (JSON, checked by scripts/content-check.mjs)
content-dev/  copyrighted dev-only material — git-ignored, never published
prompts/scoring/  protected scoring prompts
scripts/    verify.sh · guardrails-lock.sh · guardrail-selftest.sh · content-check.mjs
```
