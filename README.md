# FSI-Eng

An English drill system for Chinese speakers, built on FSI methods (pattern drills, dialogue
memorisation, ILR targets). Three tracks: business English, IT workplace English, IELTS.
Spec: https://claude.ai/artifact/QMkmBsAudG92ofpBb34Qmd

The repository is guardrailed: `./scripts/verify.sh` decides whether a change is done. Agents
(Claude Code) read `CLAUDE.md` → `AGENTS.md`.

## Requirements

- Docker Desktop: JDK 25 + Maven 3.9 run in the `maven` container, PostgreSQL 18 in `postgres`
  (see `docker-compose.yml`). A local JDK 25 + Maven also works; `scripts/mvn.sh` prefers it.
- Node.js 22+ (frontend and content checks)
- Git Bash or WSL on Windows (the scripts are bash)

## First run

```bash
git clone https://github.com/hslipal/fsi-eng.git && cd fsi-eng
docker compose up -d postgres               # PostgreSQL on localhost:5432 (fsieng / fsieng-dev)
(cd frontend && npm ci)
./scripts/verify.sh                         # guardrails → content → backend → frontend → e2e
./scripts/guardrail-selftest.sh             # every injected mistake must be "caught"
```

The first backend build downloads Maven dependencies into the `m2` Docker volume; later runs reuse it.

## Run the app against PostgreSQL

```bash
docker compose up -d postgres
docker compose --profile tools run --rm --service-ports maven \
  mvn spring-boot:run -Dspring-boot.run.profiles=postgres
(cd frontend && npm run dev)                # http://localhost:5173, proxies /api to :8080
```

Without a profile the backend uses in-memory H2 in PostgreSQL mode (tests and the CI e2e run).
Flyway migrations live in `backend/src/main/resources/db/migration`; CI also runs the backend
tests against a real PostgreSQL 18.

## Layout

```
backend/    Spring Boot 4 · Java 25 · Hibernate + Flyway · PostgreSQL · hexagonal modules under com.fsieng
frontend/   React 19 · TypeScript strict · zod · Vitest · Playwright
content/    reviewed, publishable material (JSON, checked by scripts/content-check.mjs)
content-dev/  copyrighted dev-only material — git-ignored, never published
prompts/scoring/  protected scoring prompts
scripts/    verify.sh · guardrails-lock.sh · guardrail-selftest.sh · content-check.mjs
```
