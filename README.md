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

## Run the whole app (Docker Desktop)

```bash
docker compose up -d                 # PostgreSQL + backend + frontend
docker compose logs -f backend       # first start compiles the backend: wait for "Started FsiEngApplication"
```

Open http://localhost:5173. The backend (http://localhost:8080) runs with profiles
`postgres,dev`: at startup it imports `content/` and the dev-only `content-dev/`.

- Frontend changes reload in the browser by themselves.
- Backend changes: `docker compose restart backend`.
- Stop: `docker compose down` (the database stays in the `pgdata` volume;
  `docker compose down -v` wipes it).

Without Docker for the app: `docker compose up -d postgres`, then
`docker compose --profile tools run --rm --service-ports maven mvn spring-boot:run -Dspring-boot.run.profiles=postgres,dev`
and `(cd frontend && npm run dev)`.

AI scoring (IELTS writing/speaking) needs `DEEPSEEK_API_KEY`: put `DEEPSEEK_API_KEY=...` in a
git-ignored `.env` file next to `docker-compose.yml`. Without it the assessment endpoints answer
503; everything else works.

Profile `dev` also loads copyrighted, not-yet-licensed material from `content-dev/` (e.g. the IELTS
speaking sample answers). Never use it in production.

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
